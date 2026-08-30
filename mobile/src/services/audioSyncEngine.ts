import { Audio } from 'expo-av';
import { PlaybackState, Track } from '../types';
import { mobileSocketService } from './socketService';

export type MobilePlayerStateCallback = (
  currentTime: number,
  duration: number,
  isPlaying: boolean,
  driftMs: number
) => void;

class MobileAudioSyncEngine {
  private targetPlaybackState: PlaybackState | null = null;
  private stateCallbacks: Set<MobilePlayerStateCallback> = new Set();
  private syncTimer: any = null;
  private playerRef: any = null;
  private currentRoomCode: string | null = null;
  private currentTrackId: string | null = null;
  private lastTrackChangeTime: number = 0;
  private lastSeekTime: number = 0;
  private isAudioSessionConfigured: boolean = false;

  public async initBackgroundAudioSession() {
    if (this.isAudioSessionConfigured) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isAudioSessionConfigured = true;
    } catch (e) {
      console.warn('Background audio session initialization notice:', e);
    }
  }

  public setRoomCode(code: string) {
    this.currentRoomCode = code;
  }

  public registerPlayerRef(ref: any) {
    this.playerRef = ref;
  }

  public applyPlaybackState(state: PlaybackState) {
    this.initBackgroundAudioSession();

    if (state.currentTrack?.id !== this.currentTrackId) {
      this.currentTrackId = state.currentTrack?.id || null;
      this.lastTrackChangeTime = Date.now();
      try {
        this.playerRef?.pauseVideo?.();
      } catch (_) {}
    }

    this.targetPlaybackState = state;

    // Enforce strict pause / play status immediately
    if (state.status === 'PAUSED') {
      try {
        this.playerRef?.pauseVideo?.();
      } catch (_) {}
    } else if (state.status === 'PLAYING') {
      try {
        this.playerRef?.playVideo?.();
      } catch (_) {}
    }

    this.startSyncLoop();
    this.synchronizePosition();
  }

  /**
   * Speaker Sync Engine with Buffering Grace Period & Strict Pause Enforcement
   */
  public async synchronizePosition() {
    if (!this.playerRef || !this.targetPlaybackState || !this.targetPlaybackState.currentTrack) return;

    try {
      const state = this.targetPlaybackState;
      const serverNow = mobileSocketService.getServerTime();
      const elapsedSeconds = (serverNow - state.serverEpochTime) / 1000;
      const targetPosition = state.currentTime + elapsedSeconds * (state.playbackRate || 1.0);

      if (state.status === 'PAUSED') {
        try {
          this.playerRef?.pauseVideo?.();
        } catch (_) {}
        const actualPos = (await this.playerRef.getCurrentTime?.()) || state.currentTime;
        const dur = (await this.playerRef.getDuration?.()) || state.currentTrack?.duration || 0;
        this.notifyCallbacks(actualPos, dur, false, 0);
        return;
      }

      const actualPos = await this.playerRef.getCurrentTime?.();
      if (typeof actualPos === 'number') {
        const drift = actualPos - targetPosition;
        const driftMs = Math.round(drift * 1000);

        const isGracePeriod = Date.now() - this.lastTrackChangeTime < 3000;
        const isSeekCoolingDown = Date.now() - this.lastSeekTime < 3000;

        // Auto-correct only if drift > 1.5s and not in buffering grace period
        if (state.status === 'PLAYING' && Math.abs(drift) > 1.5 && !isGracePeriod && !isSeekCoolingDown) {
          this.lastSeekTime = Date.now();
          this.playerRef.seekTo?.(targetPosition, true);
        }

        const dur = (await this.playerRef.getDuration?.()) || state.currentTrack?.duration || 0;
        this.notifyCallbacks(actualPos, dur, true, driftMs);
      }
    } catch (e) {
      // Ignored during player buffering
    }
  }

  private startSyncLoop() {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => {
      this.synchronizePosition();
    }, 450);
  }

  public subscribe(cb: MobilePlayerStateCallback): () => void {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  private notifyCallbacks(currentTime: number, duration: number, isPlaying: boolean, driftMs: number) {
    this.stateCallbacks.forEach((cb) => cb(currentTime, duration, isPlaying, driftMs));
  }

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.playerRef = null;
    this.currentTrackId = null;
  }
}

export const mobileAudioSyncEngine = new MobileAudioSyncEngine();
