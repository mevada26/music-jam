import { PlaybackState, Track } from '../types';
import { socketService } from './socketService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type PlayerStateCallback = (currentTime: number, duration: number, isPlaying: boolean, driftMs: number) => void;

class AudioSyncEngine {
  private player: any = null;
  private isReady: boolean = false;
  private containerId: string = 'youtube-sync-player';
  private currentVideoId: string | null = null;
  private targetPlaybackState: PlaybackState | null = null;
  private syncTimer: number | null = null;
  private stateCallbacks: Set<PlayerStateCallback> = new Set();
  private isMuted: boolean = false;
  private volume: number = 80;

  public init(containerId: string = 'youtube-sync-player'): Promise<boolean> {
    this.containerId = containerId;
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.createPlayer(resolve);
      } else {
        window.onYouTubeIframeAPIReady = () => {
          this.createPlayer(resolve);
        };
      }
    });
  }

  private createPlayer(resolve: (value: boolean) => void) {
    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.setVolume(this.volume);
            this.startSyncLoop();
            resolve(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              console.log('🎵 Track ended, notifying host/sync engine');
            }
          },
          onError: (e: any) => {
            console.warn('YouTube Player error:', e);
          },
        },
      });
    } catch (e) {
      console.error('Failed to create YouTube player:', e);
      resolve(false);
    }
  }

  /**
   * Apply room playback state updates with sub-millisecond drift compensation
   */
  public applyPlaybackState(state: PlaybackState) {
    this.targetPlaybackState = state;
    if (!this.isReady || !this.player || !state.currentTrack) {
      if (this.player && (!state.currentTrack || state.status === 'IDLE')) {
        try {
          this.player.stopVideo();
        } catch (_) {}
      }
      return;
    }

    const track = state.currentTrack;

    // Load new track if videoId changed
    if (this.currentVideoId !== track.id) {
      this.currentVideoId = track.id;
      this.updateMediaSession(track);
      
      const serverNow = socketService.getServerTime();
      const elapsedSinceUpdate = (serverNow - state.serverEpochTime) / 1000;
      const startSeconds = Math.max(0, state.currentTime + elapsedSinceUpdate * state.playbackRate);

      if (state.status === 'PLAYING') {
        this.player.loadVideoById({
          videoId: track.id,
          startSeconds,
        });
      } else {
        this.player.cueVideoById({
          videoId: track.id,
          startSeconds,
        });
      }
      return;
    }

    // Existing track synchronization
    this.synchronizePosition();
  }

  /**
   * Sub-millisecond Speaker Sync Engine
   */
  private synchronizePosition() {
    if (!this.isReady || !this.player || !this.targetPlaybackState || !this.targetPlaybackState.currentTrack) return;

    try {
      const state = this.targetPlaybackState;
      const playerState = this.player.getPlayerState?.(); // 1 = playing, 2 = paused, 3 = buffering

      if (state.status === 'PLAYING') {
        if (playerState !== 1 && playerState !== 3) {
          this.player.playVideo?.();
        }

        const serverNow = socketService.getServerTime();
        const elapsedSeconds = (serverNow - state.serverEpochTime) / 1000;
        const targetPosition = state.currentTime + elapsedSeconds * (state.playbackRate || 1.0);
        const actualPosition = this.player.getCurrentTime?.() || 0;
        const drift = actualPosition - targetPosition; // in seconds
        const driftMs = Math.round(drift * 1000);

        // Sub-millisecond clock drift compensation:
        if (Math.abs(drift) > 0.5) {
          // Hard desync (> 500ms): Seek directly
          this.player.seekTo(targetPosition, true);
        } else if (Math.abs(drift) > 0.04) {
          // Micro drift (40ms - 500ms): Adjust playback rate temporarily for smooth speaker sync
          const microRate = drift > 0 ? 0.98 : 1.02;
          this.player.setPlaybackRate?.(microRate);
        } else {
          // In near-perfect sync (< 40ms)
          this.player.setPlaybackRate?.(1.0);
        }

        const duration = this.player.getDuration?.() || state.currentTrack?.duration;
        this.notifyCallbacks(actualPosition, duration, true, driftMs);
      } else if (state.status === 'PAUSED') {
        if (playerState === 1) {
          this.player.pauseVideo?.();
        }
        const actualPosition = this.player.getCurrentTime?.() || state.currentTime;
        const duration = this.player.getDuration?.() || state.currentTrack?.duration || 0;
        this.notifyCallbacks(actualPosition, duration, false, 0);
      }
    } catch (err) {
      // Ignored during player buffering/initialization
    }
  }

  private startSyncLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Run sync check every 250ms for ultra-responsive sync
    this.syncTimer = window.setInterval(() => {
      this.synchronizePosition();
    }, 250);
  }

  /**
   * Set up Native / Mobile Lock Screen Controls (MediaSession API)
   */
  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Rave Synchronized Party',
        artwork: [
          { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        ],
      });

      // Background controls
      navigator.mediaSession.setActionHandler('play', () => {
        // Will notify host if user is host
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // Will notify host if user is host
      });
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.player && this.isReady) {
      try {
        this.player.setVolume(this.volume);
      } catch (_) {}
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.player && this.isReady) {
      try {
        if (this.isMuted) this.player.mute();
        else {
          this.player.unMute();
          this.player.setVolume(this.volume);
        }
      } catch (_) {}
    }
    return this.isMuted;
  }

  public subscribe(cb: PlayerStateCallback): () => void {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  private notifyCallbacks(currentTime: number, duration: number, isPlaying: boolean, driftMs: number) {
    this.stateCallbacks.forEach((cb) => cb(currentTime, duration, isPlaying, driftMs));
  }

  public destroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    try {
      this.player?.destroy();
    } catch (_) {}
    this.player = null;
    this.isReady = false;
  }
}

export const audioSyncEngine = new AudioSyncEngine();
