import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager.js';
import { NTPRequest, NTPResponse, PlaybackState, Track } from '../types/index.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;

    /**
     * NTP Clock Synchronization Protocol (Cristian's Algorithm)
     * Provides sub-millisecond clock drift calibration for Speaker Sync
     */
    socket.on('sync:ntp_ping', (data: NTPRequest) => {
      const serverReceiveTime = Date.now();
      const response: NTPResponse = {
        clientSendTime: data.clientSendTime,
        serverReceiveTime,
        serverTransmitTime: Date.now(),
      };
      socket.emit('sync:ntp_pong', response);
    });

    /**
     * Create Room (Caller becomes Host)
     */
    socket.on('room:create', ({ hostName, hostAvatar, roomName }, callback) => {
      const room = RoomManager.createRoom(socket.id, hostName, hostAvatar, roomName);
      currentRoomCode = room.code;
      socket.join(room.code);

      if (typeof callback === 'function') {
        callback({
          success: true,
          room,
          participant: room.participants[socket.id],
          messages: RoomManager.getChatMessages(room.code),
        });
      }
    });

    /**
     * Join Room
     */
    socket.on('room:join', ({ roomCode, name, avatar }, callback) => {
      const result = RoomManager.joinRoom(roomCode, socket.id, name, avatar);

      if (!result) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room not found or invalid room code' });
        }
        return;
      }

      currentRoomCode = result.room.code;
      socket.join(result.room.code);

      // Notify the joining user
      if (typeof callback === 'function') {
        callback({
          success: true,
          room: result.room,
          participant: result.participant,
          messages: RoomManager.getChatMessages(result.room.code),
        });
      }

      // Broadcast update to all other room members
      io.to(result.room.code).emit('room:updated', result.room);
      io.to(result.room.code).emit('chat:messages', RoomManager.getChatMessages(result.room.code));
    });

    /**
     * Host Playback Control: Play / Pause / Seek
     */
    socket.on('playback:update', ({ roomCode, updates }: { roomCode: string; updates: Partial<PlaybackState> }, callback) => {
      const result = RoomManager.updatePlaybackState(roomCode, socket.id, updates);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      // Broadcast synced playback state with fresh server epoch time to all clients
      io.to(roomCode).emit('playback:sync', result.room!.playbackState);
      if (typeof callback === 'function') callback({ success: true });
    });

    /**
     * Host Playback: Play Track Immediately
     */
    socket.on('playback:play_track', ({ roomCode, track }: { roomCode: string; track: Track }, callback) => {
      const result = RoomManager.playTrack(roomCode, socket.id, track);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      io.to(roomCode).emit('room:updated', result.room);
      io.to(roomCode).emit('playback:sync', result.room!.playbackState);
      if (typeof callback === 'function') callback({ success: true });
    });

    /**
     * Host or Auto-Trigger: Skip Track
     */
    socket.on('playback:skip', async ({ roomCode }: { roomCode: string }, callback) => {
      const result = await RoomManager.skipTrack(roomCode, socket.id);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      io.to(roomCode).emit('room:updated', result.room);
      io.to(roomCode).emit('playback:sync', result.room!.playbackState);
      io.to(roomCode).emit('chat:messages', RoomManager.getChatMessages(roomCode));
      if (typeof callback === 'function') callback({ success: true });
    });

    /**
     * Host: Add to Queue
     */
    socket.on('queue:add', ({ roomCode, track }: { roomCode: string; track: Track }, callback) => {
      const result = RoomManager.addToQueue(roomCode, socket.id, track);
      if (!result.success) {
        if (typeof callback === 'function') callback(result);
        return;
      }

      io.to(roomCode).emit('room:updated', result.room);
      if (result.room?.playbackState) {
        io.to(roomCode).emit('playback:sync', result.room.playbackState);
      }
      if (typeof callback === 'function') callback({ success: true });
    });

    /**
     * Host: Remove from Queue
     */
    socket.on('queue:remove', ({ roomCode, index }: { roomCode: string; index: number }) => {
      const result = RoomManager.removeFromQueue(roomCode, socket.id, index);
      if (result.success && result.room) {
        io.to(roomCode).emit('room:updated', result.room);
      }
    });

    /**
     * Host: Toggle Auto-Queue
     */
    socket.on('queue:toggle_auto', ({ roomCode }: { roomCode: string }) => {
      const result = RoomManager.toggleAutoQueue(roomCode, socket.id);
      if (result.success) {
        io.to(roomCode).emit('queue:auto_toggled', result.autoQueueEnabled);
      }
    });

    /**
     * Chat: Send text message
     */
    socket.on('chat:send', ({ roomCode, content }: { roomCode: string; content: string }) => {
      const room = RoomManager.getRoom(roomCode);
      if (!room || !content?.trim()) return;

      const participant = room.participants[socket.id];
      if (!participant) return;

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: participant.id,
        senderName: participant.name,
        senderAvatar: participant.avatar,
        senderRole: participant.role,
        content: content.trim(),
        type: 'text' as const,
        timestamp: Date.now(),
      };

      RoomManager.addChatMessage(roomCode, message);
      io.to(roomCode).emit('chat:new_message', message);
    });

    /**
     * Chat: Suggest Song (From any participant)
     */
    socket.on('suggestion:create', ({ roomCode, track }: { roomCode: string; track: Track }, callback) => {
      const room = RoomManager.getRoom(roomCode);
      if (!room) return;

      const participant = room.participants[socket.id];
      if (!participant) return;

      const result = RoomManager.suggestSong(roomCode, participant, track);
      if (!result) return;

      io.to(roomCode).emit('chat:new_message', result.message);
      if (typeof callback === 'function') callback({ success: true, suggestion: result.suggestion });
    });

    /**
     * Suggestion: Upvote
     */
    socket.on('suggestion:upvote', ({ roomCode, suggestionId }: { roomCode: string; suggestionId: string }) => {
      const updatedSuggestion = RoomManager.toggleUpvoteSuggestion(roomCode, suggestionId, socket.id);
      if (updatedSuggestion) {
        io.to(roomCode).emit('suggestion:updated', updatedSuggestion);
        io.to(roomCode).emit('chat:messages', RoomManager.getChatMessages(roomCode));
      }
    });

    /**
     * Suggestion: Host Resolution (Add to Queue / Play Next / Decline)
     */
    socket.on(
      'suggestion:resolve',
      (
        {
          roomCode,
          suggestionId,
          action,
        }: {
          roomCode: string;
          suggestionId: string;
          action: 'add_to_queue' | 'play_next' | 'reject';
        },
        callback
      ) => {
        const result = RoomManager.resolveSuggestion(roomCode, socket.id, suggestionId, action);
        if (!result.success) {
          if (typeof callback === 'function') callback(result);
          return;
        }

        io.to(roomCode).emit('room:updated', result.room);
        io.to(roomCode).emit('playback:sync', result.room!.playbackState);
        io.to(roomCode).emit('chat:messages', RoomManager.getChatMessages(roomCode));
        if (typeof callback === 'function') callback({ success: true });
      }
    );

    /**
     * Handle Disconnection
     */
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const result = RoomManager.leaveRoom(currentRoomCode, socket.id);
        if (result.room) {
          io.to(currentRoomCode).emit('room:updated', result.room);
          io.to(currentRoomCode).emit('chat:messages', RoomManager.getChatMessages(currentRoomCode));
        }
      }
    });
  });
}
