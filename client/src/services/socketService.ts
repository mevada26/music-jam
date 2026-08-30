import { io, Socket } from 'socket.io-client';
import { Room, Participant, PlaybackState, ChatMessage, SongSuggestion, NTPResponse, SyncStats, Track } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private syncStats: SyncStats = {
    roundTripTime: 0,
    clockOffset: 0,
    estimatedDrift: 0,
    isCalibrated: false,
  };
  private ntpInterval: number | null = null;

  public connect(url: string = import.meta.env.VITE_SERVER_URL || 'https://music-jam-e4fx.onrender.com'): Socket {
    if (this.socket) return this.socket;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Rave Sync server:', this.socket?.id);
      this.startNTPCalibration();
    });

    this.socket.on('sync:ntp_pong', (response: NTPResponse) => {
      const clientReceiveTime = Date.now();
      const rtt = clientReceiveTime - response.clientSendTime;
      const serverMidpoint = (response.serverReceiveTime + response.serverTransmitTime) / 2;
      const clientMidpoint = (response.clientSendTime + clientReceiveTime) / 2;
      const offset = serverMidpoint - clientMidpoint;

      this.syncStats.roundTripTime = rtt;
      this.syncStats.clockOffset = offset;
      this.syncStats.isCalibrated = true;
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getSyncStats(): SyncStats {
    return this.syncStats;
  }

  private startNTPCalibration() {
    this.sendNTPPing();
    if (this.ntpInterval) clearInterval(this.ntpInterval);
    this.ntpInterval = window.setInterval(() => {
      this.sendNTPPing();
    }, 5000);
  }

  public sendNTPPing() {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sync:ntp_ping', { clientSendTime: Date.now() });
  }

  public getServerTime(): number {
    return Date.now() + this.syncStats.clockOffset;
  }

  // Room operations
  public createRoom(
    hostName: string,
    hostAvatar: string,
    roomName?: string
  ): Promise<{ success: boolean; room: Room; participant: Participant; messages: ChatMessage[] }> {
    return new Promise((resolve) => {
      this.socket?.emit('room:create', { hostName, hostAvatar, roomName }, resolve);
    });
  }

  public joinRoom(
    roomCode: string,
    name: string,
    avatar: string
  ): Promise<{ success: boolean; room?: Room; participant?: Participant; messages?: ChatMessage[]; error?: string }> {
    return new Promise((resolve) => {
      this.socket?.emit('room:join', { roomCode, name, avatar }, resolve);
    });
  }

  // Host Playback Actions
  public updatePlayback(roomCode: string, updates: Partial<PlaybackState>) {
    this.socket?.emit('playback:update', { roomCode, updates });
  }

  public playTrack(roomCode: string, track: Track) {
    this.socket?.emit('playback:play_track', { roomCode, track });
  }

  public skipTrack(roomCode: string) {
    this.socket?.emit('playback:skip', { roomCode });
  }

  public addToQueue(roomCode: string, track: Track) {
    this.socket?.emit('queue:add', { roomCode, track });
  }

  public removeFromQueue(roomCode: string, index: number) {
    this.socket?.emit('queue:remove', { roomCode, index });
  }

  public toggleAutoQueue(roomCode: string) {
    this.socket?.emit('queue:toggle_auto', { roomCode });
  }

  // Chat & Suggestions
  public sendChatMessage(roomCode: string, content: string) {
    this.socket?.emit('chat:send', { roomCode, content });
  }

  public suggestSong(roomCode: string, track: Track) {
    this.socket?.emit('suggestion:create', { roomCode, track });
  }

  public upvoteSuggestion(roomCode: string, suggestionId: string) {
    this.socket?.emit('suggestion:upvote', { roomCode, suggestionId });
  }

  public resolveSuggestion(roomCode: string, suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') {
    this.socket?.emit('suggestion:resolve', { roomCode, suggestionId, action });
  }

  public disconnect() {
    if (this.ntpInterval) clearInterval(this.ntpInterval);
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
