import { Room, Participant, Track, PlaybackState, SongSuggestion, ChatMessage } from '../types/index.js';
import { YouTubeService } from './youtubeService.js';

export class RoomManager {
  private static rooms: Map<string, Room> = new Map();
  private static suggestions: Map<string, SongSuggestion[]> = new Map(); // roomCode -> suggestions
  private static chatMessages: Map<string, ChatMessage[]> = new Map(); // roomCode -> messages

  /**
   * Generate unique 6-character room code
   */
  private static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return RoomManager.rooms.has(code) ? RoomManager.generateRoomCode() : code;
  }

  /**
   * Create a new room
   */
  public static createRoom(hostId: string, hostName: string, hostAvatar: string, roomName?: string): Room {
    const code = this.generateRoomCode();
    const host: Participant = {
      id: hostId,
      name: hostName || 'Party Host',
      avatar: hostAvatar || '🎧',
      role: 'host',
      joinedAt: Date.now(),
      isSpeakerSyncEnabled: true,
      clockOffset: 0,
    };

    const room: Room = {
      code,
      name: roomName || `${hostName}'s Watch Party`,
      hostId,
      participants: { [hostId]: host },
      playbackState: {
        status: 'IDLE',
        currentTrack: null,
        currentTime: 0,
        serverEpochTime: Date.now(),
        playbackRate: 1.0,
      },
      queue: [],
      history: [],
      autoQueueEnabled: true,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.suggestions.set(code, []);
    this.chatMessages.set(code, [
      {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'Rave Bot',
        senderAvatar: '🤖',
        senderRole: 'system',
        content: `Welcome to ${room.name}! Host has full playback controls. Suggest songs in chat anytime! 🎉`,
        type: 'system',
        timestamp: Date.now(),
      },
    ]);

    return room;
  }

  /**
   * Get room by code
   */
  public static getRoom(code: string): Room | null {
    return this.rooms.get(code.toUpperCase()) || null;
  }

  /**
   * Join an existing room
   */
  public static joinRoom(code: string, participantId: string, name: string, avatar: string): { room: Room; participant: Participant } | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const isHost = room.hostId === participantId;
    const participant: Participant = {
      id: participantId,
      name: name || `Guest-${participantId.slice(0, 4)}`,
      avatar: avatar || '🎵',
      role: isHost ? 'host' : 'listener',
      joinedAt: Date.now(),
      isSpeakerSyncEnabled: true,
      clockOffset: 0,
    };

    room.participants[participantId] = participant;

    this.addChatMessage(room.code, {
      id: `sys-join-${Date.now()}-${participantId}`,
      senderId: 'system',
      senderName: 'Rave Bot',
      senderAvatar: '🤖',
      senderRole: 'system',
      content: `${participant.name} joined the room 👋`,
      type: 'system',
      timestamp: Date.now(),
    });

    return { room, participant };
  }

  /**
   * Leave room
   */
  public static leaveRoom(code: string, participantId: string): { room: Room | null; newHostId?: string } {
    const room = this.getRoom(code);
    if (!room) return { room: null };

    const participant = room.participants[participantId];
    delete room.participants[participantId];

    const remainingParticipants = Object.keys(room.participants);
    if (remainingParticipants.length === 0) {
      // Clean up empty room
      this.rooms.delete(code);
      this.suggestions.delete(code);
      this.chatMessages.delete(code);
      return { room: null };
    }

    let newHostId: string | undefined;
    // If host left, assign the oldest participant as new host
    if (room.hostId === participantId) {
      newHostId = remainingParticipants[0];
      room.hostId = newHostId;
      room.participants[newHostId].role = 'host';

      this.addChatMessage(room.code, {
        id: `sys-host-${Date.now()}`,
        senderId: 'system',
        senderName: 'Rave Bot',
        senderAvatar: '👑',
        senderRole: 'system',
        content: `${room.participants[newHostId].name} is now the Room Host! 👑`,
        type: 'system',
        timestamp: Date.now(),
      });
    } else if (participant) {
      this.addChatMessage(room.code, {
        id: `sys-leave-${Date.now()}-${participantId}`,
        senderId: 'system',
        senderName: 'Rave Bot',
        senderAvatar: '🤖',
        senderRole: 'system',
        content: `${participant.name} left the room.`,
        type: 'system',
        timestamp: Date.now(),
      });
    }

    return { room, newHostId };
  }

  /**
   * Host Playback Control (Play / Pause / Seek / PlaybackRate)
   */
  public static updatePlaybackState(
    code: string,
    requesterId: string,
    updates: Partial<PlaybackState>
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };

    // Strict Host-Authority check
    if (room.hostId !== requesterId) {
      return { success: false, error: 'Only the Room Host can control playback' };
    }

    // Apply updates
    if (updates.status !== undefined) room.playbackState.status = updates.status;
    if (updates.currentTime !== undefined) room.playbackState.currentTime = updates.currentTime;
    if (updates.playbackRate !== undefined) room.playbackState.playbackRate = updates.playbackRate;
    if (updates.currentTrack !== undefined) room.playbackState.currentTrack = updates.currentTrack;

    room.playbackState.serverEpochTime = Date.now();
    return { success: true, room };
  }

  /**
   * Play specific track immediately (Host Only)
   */
  public static playTrack(code: string, requesterId: string, track: Track): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { success: false, error: 'Only Host can start tracks' };

    if (room.playbackState.currentTrack) {
      room.history.unshift(room.playbackState.currentTrack);
      if (room.history.length > 50) room.history.pop();
    }

    room.playbackState = {
      status: 'PLAYING',
      currentTrack: track,
      currentTime: 0,
      serverEpochTime: Date.now(),
      playbackRate: 1.0,
    };

    return { success: true, room };
  }

  /**
   * Skip to next track (Host Only or triggered on song end)
   */
  public static async skipTrack(code: string, requesterId: string): Promise<{ success: boolean; room?: Room; error?: string }> {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { success: false, error: 'Only Host can skip tracks' };

    if (room.playbackState.currentTrack) {
      room.history.unshift(room.playbackState.currentTrack);
      if (room.history.length > 50) room.history.pop();
    }

    // Check queue
    if (room.queue.length > 0) {
      const nextTrack = room.queue.shift()!;
      room.playbackState = {
        status: 'PLAYING',
        currentTrack: nextTrack,
        currentTime: 0,
        serverEpochTime: Date.now(),
        playbackRate: 1.0,
      };
      return { success: true, room };
    }

    // Queue is empty: check if autoQueueEnabled is active
    if (room.autoQueueEnabled && room.playbackState.currentTrack) {
      const historyIds = room.history.map((t) => t.id);
      const recommendations = await YouTubeService.getRecommendations(room.playbackState.currentTrack, historyIds);

      if (recommendations.length > 0) {
        const autoTrack = recommendations[0];
        // Populate the rest into queue
        room.queue.push(...recommendations.slice(1, 5));

        room.playbackState = {
          status: 'PLAYING',
          currentTrack: autoTrack,
          currentTime: 0,
          serverEpochTime: Date.now(),
          playbackRate: 1.0,
        };

        this.addChatMessage(room.code, {
          id: `sys-auto-${Date.now()}`,
          senderId: 'system',
          senderName: 'Auto-Queue',
          senderAvatar: '🤖',
          senderRole: 'system',
          content: `Queue was empty. Auto-playing related track: "${autoTrack.title}" 🎶`,
          type: 'system',
          timestamp: Date.now(),
        });

        return { success: true, room };
      }
    }

    // No next track available
    room.playbackState = {
      status: 'IDLE',
      currentTrack: null,
      currentTime: 0,
      serverEpochTime: Date.now(),
      playbackRate: 1.0,
    };

    return { success: true, room };
  }

  /**
   * Add Track to Queue (Host can add directly, or auto-start if IDLE)
   */
  public static addToQueue(code: string, requesterId: string, track: Track): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { success: false, error: 'Only Host can modify queue' };

    // If room is idle, play immediately
    if (room.playbackState.status === 'IDLE' || !room.playbackState.currentTrack) {
      return this.playTrack(code, requesterId, track);
    }

    room.queue.push(track);
    return { success: true, room };
  }

  /**
   * Remove from Queue (Host Only)
   */
  public static removeFromQueue(code: string, requesterId: string, index: number): { success: boolean; room?: Room } {
    const room = this.getRoom(code);
    if (!room || room.hostId !== requesterId) return { success: false };
    if (index >= 0 && index < room.queue.length) {
      room.queue.splice(index, 1);
    }
    return { success: true, room };
  }

  /**
   * Reorder Queue (Host Only)
   */
  public static reorderQueue(code: string, requesterId: string, queue: Track[]): { success: boolean; room?: Room } {
    const room = this.getRoom(code);
    if (!room || room.hostId !== requesterId) return { success: false };
    room.queue = queue;
    return { success: true, room };
  }

  /**
   * Toggle Auto-Queue (Host Only)
   */
  public static toggleAutoQueue(code: string, requesterId: string): { success: boolean; autoQueueEnabled?: boolean } {
    const room = this.getRoom(code);
    if (!room || room.hostId !== requesterId) return { success: false };
    room.autoQueueEnabled = !room.autoQueueEnabled;
    return { success: true, autoQueueEnabled: room.autoQueueEnabled };
  }

  /**
   * Chat: Add message
   */
  public static addChatMessage(code: string, message: ChatMessage): ChatMessage[] {
    const messages = this.chatMessages.get(code) || [];
    messages.push(message);
    if (messages.length > 200) messages.shift();
    this.chatMessages.set(code, messages);
    return messages;
  }

  public static getChatMessages(code: string): ChatMessage[] {
    return this.chatMessages.get(code) || [];
  }

  /**
   * Song Suggestion from any Participant to Chat
   */
  public static suggestSong(
    code: string,
    sender: Participant,
    track: Track
  ): { suggestion: SongSuggestion; message: ChatMessage } | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const suggestionId = `sug-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const suggestion: SongSuggestion = {
      id: suggestionId,
      track: {
        ...track,
        suggestedBy: { id: sender.id, name: sender.name },
      },
      suggestedBy: {
        id: sender.id,
        name: sender.name,
        avatar: sender.avatar,
      },
      upvotes: [sender.id], // Submitter automatically upvotes
      status: 'pending',
      createdAt: Date.now(),
    };

    const suggestions = this.suggestions.get(code) || [];
    suggestions.push(suggestion);
    this.suggestions.set(code, suggestions);

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderRole: sender.role,
      content: `Suggested "${track.title}"`,
      type: 'suggestion',
      suggestion,
      timestamp: Date.now(),
    };

    this.addChatMessage(code, message);
    return { suggestion, message };
  }

  /**
   * Upvote a song suggestion
   */
  public static toggleUpvoteSuggestion(code: string, suggestionId: string, userId: string): SongSuggestion | null {
    const suggestions = this.suggestions.get(code) || [];
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return null;

    const voteIdx = suggestion.upvotes.indexOf(userId);
    if (voteIdx > -1) {
      suggestion.upvotes.splice(voteIdx, 1);
    } else {
      suggestion.upvotes.push(userId);
    }

    // Also update matching chat message suggestion object
    const messages = this.chatMessages.get(code) || [];
    const msg = messages.find((m) => m.suggestion && m.suggestion.id === suggestionId);
    if (msg && msg.suggestion) {
      msg.suggestion.upvotes = suggestion.upvotes;
    }

    return suggestion;
  }

  /**
   * Host Action: Accept or Decline Suggestion
   */
  public static resolveSuggestion(
    code: string,
    requesterId: string,
    suggestionId: string,
    action: 'add_to_queue' | 'play_next' | 'reject'
  ): { success: boolean; room?: Room; suggestion?: SongSuggestion; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { success: false, error: 'Only Host can approve suggestions' };

    const suggestions = this.suggestions.get(code) || [];
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return { success: false, error: 'Suggestion not found' };

    if (action === 'reject') {
      suggestion.status = 'rejected';
    } else {
      suggestion.status = 'accepted';
      if (action === 'play_next') {
        room.queue.unshift(suggestion.track);
      } else {
        if (room.playbackState.status === 'IDLE' || !room.playbackState.currentTrack) {
          this.playTrack(code, requesterId, suggestion.track);
        } else {
          room.queue.push(suggestion.track);
        }
      }

      this.addChatMessage(code, {
        id: `sys-acc-${Date.now()}`,
        senderId: 'system',
        senderName: 'Host Action',
        senderAvatar: '✅',
        senderRole: 'system',
        content: `👑 Host approved suggestion "${suggestion.track.title}"! Added to queue.`,
        type: 'system',
        timestamp: Date.now(),
      });
    }

    // Update in chat message list too
    const messages = this.chatMessages.get(code) || [];
    const msg = messages.find((m) => m.suggestion && m.suggestion.id === suggestionId);
    if (msg && msg.suggestion) {
      msg.suggestion.status = suggestion.status;
    }

    return { success: true, room, suggestion };
  }
}
