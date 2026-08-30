import { io, Socket } from 'socket.io-client';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { Room, Participant, PlaybackState, ChatMessage, SongSuggestion, NTPResponse, SyncStats, Track } from '../types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type StatusListener = (status: ConnectionStatus, error: string | null) => void;

/**
 * Auto-detect development machine host IP for React Native / Expo.
 * - On Expo Go (Physical Device or Emulator), hostUri contains the PC's LAN IP (e.g. 192.168.1.50:8081)
 * - On Android Emulator fallback, 10.0.2.2 maps to host localhost
 * - On iOS Simulator / Web fallback, localhost maps to host
 */
export function getAutoDetectedServerUrl(): string {
  // 1. Check if public cloud server URL (e.g. Render) is configured in environment
  if (process.env.EXPO_PUBLIC_SERVER_URL && process.env.EXPO_PUBLIC_SERVER_URL.trim().length > 0) {
    return process.env.EXPO_PUBLIC_SERVER_URL.trim();
  }

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3001`;
      }
    }

    const scriptURL = (NativeModules as any)?.SourceCode?.scriptURL;
    if (typeof scriptURL === 'string') {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:3001`;
      }
    }
  } catch (e) {
    // Ignore and proceed to platform fallback
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

export const DEFAULT_SERVER_URL = getAutoDetectedServerUrl();

class MobileSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = DEFAULT_SERVER_URL;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private connectionError: string | null = null;
  private statusListeners: Set<StatusListener> = new Set();

  private syncStats: SyncStats = {
    roundTripTime: 0,
    clockOffset: 0,
    estimatedDrift: 0,
    isCalibrated: false,
  };
  private ntpInterval: any = null;

  public setServerUrl(url: string) {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (this.serverUrl !== trimmed) {
      this.serverUrl = trimmed;
      if (this.socket) {
        this.disconnect();
        this.connect(this.serverUrl);
      }
    }
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getConnectionError(): string | null {
    return this.connectionError;
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus, this.connectionError);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(status: ConnectionStatus, error: string | null = null) {
    this.connectionStatus = status;
    this.connectionError = error;
    this.statusListeners.forEach((l) => l(status, error));
  }

  public connect(url: string = this.serverUrl): Socket {
    if (this.socket && this.socket.connected && this.serverUrl === url) {
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.serverUrl = url;
    this.notifyStatus('connecting');

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 8000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Mobile connected to Rave Server:', this.socket?.id, 'at', this.serverUrl);
      this.notifyStatus('connected');
      this.startNTPCalibration();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Mobile disconnected from server:', reason);
      this.notifyStatus('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('❌ Mobile socket connection error:', err.message);
      this.notifyStatus('error', err.message);
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
    this.ntpInterval = setInterval(() => {
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

  // Room operations with guaranteed timeout
  public createRoom(
    hostName: string,
    hostAvatar: string,
    roomName?: string,
    timeoutMs: number = 8000
  ): Promise<{ success: boolean; room: Room; participant: Participant; messages: ChatMessage[] }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      let timer: any = null;
      let settled = false;

      const finish = (result: any, isError = false) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (isError) {
          reject(result);
        } else {
          resolve(result);
        }
      };

      timer = setTimeout(() => {
        finish(
          new Error(
            `Connection timeout. Cannot reach server at "${this.serverUrl}". Please verify the backend is running and your device is on the same network.`
          ),
          true
        );
      }, timeoutMs);

      const emitAction = () => {
        this.socket?.emit('room:create', { hostName, hostAvatar, roomName }, (response: any) => {
          finish(response);
        });
      };

      if (this.socket?.connected) {
        emitAction();
      } else {
        this.socket?.once('connect', () => {
          if (!settled) emitAction();
        });
        // Force connect if disconnected
        this.socket?.connect();
      }
    });
  }

  public joinRoom(
    roomCode: string,
    name: string,
    avatar: string,
    timeoutMs: number = 8000
  ): Promise<{ success: boolean; room?: Room; participant?: Participant; messages?: ChatMessage[]; error?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect();
      }

      let timer: any = null;
      let settled = false;

      const finish = (result: any, isError = false) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (isError) {
          reject(result);
        } else {
          resolve(result);
        }
      };

      timer = setTimeout(() => {
        finish(
          new Error(
            `Connection timeout. Cannot reach server at "${this.serverUrl}". Please verify the backend is running and the room code is valid.`
          ),
          true
        );
      }, timeoutMs);

      const emitAction = () => {
        this.socket?.emit('room:join', { roomCode, name, avatar }, (response: any) => {
          finish(response);
        });
      };

      if (this.socket?.connected) {
        emitAction();
      } else {
        this.socket?.once('connect', () => {
          if (!settled) emitAction();
        });
        // Force connect if disconnected
        this.socket?.connect();
      }
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
    this.notifyStatus('disconnected');
  }
}

export const mobileSocketService = new MobileSocketService();
