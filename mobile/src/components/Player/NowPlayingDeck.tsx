import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Crown,
  Search,
  Music,
  Tv,
  ShieldCheck,
} from 'lucide-react-native';
import { PlaybackState, Participant, SyncStats } from '../../types';
import { AudioVisualizer } from './AudioVisualizer';
import { mobileSocketService } from '../../services/socketService';
import { mobileAudioSyncEngine } from '../../services/audioSyncEngine';

interface NowPlayingDeckProps {
  playbackState: PlaybackState;
  currentParticipant: Participant | null;
  currentTime: number;
  duration: number;
  syncStats: SyncStats;
  autoQueueEnabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onToggleAutoQueue: () => void;
  onOpenSearch?: () => void;
  onOpenVideo?: () => void;
  roomCode: string;
}

// Injected high-performance Ad-Blocker & Instant-Skip script for YouTube WebViews
const AD_BLOCK_INJECTED_JS = `
  (function() {
    const killAds = () => {
      // 1. Auto-click all YouTube Skip Ad buttons
      const skipBtns = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-overlay-close-button');
      skipBtns.forEach(b => {
        if (b && typeof b.click === 'function') {
          b.click();
        }
      });

      // 2. Fast-forward video ad in 0.01 seconds
      const isAd = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
      const video = document.querySelector('video');
      if (isAd && video) {
        video.muted = true;
        video.playbackRate = 16.0;
        if (video.duration && !isNaN(video.duration)) {
          video.currentTime = video.duration;
        }
      }

      // 3. Remove banner ad overlays
      const adOverlays = document.querySelectorAll('.ytp-ad-module, .ytp-ad-image-overlay, .ytp-ad-overlay-container, #player-ads, .ytp-ad-text-overlay');
      adOverlays.forEach(el => {
        if (el) el.style.display = 'none';
      });
    };

    setInterval(killAds, 80);
  })();
  true;
`;

export const NowPlayingDeck: React.FC<NowPlayingDeckProps> = ({
  playbackState,
  currentParticipant,
  currentTime,
  duration,
  syncStats,
  autoQueueEnabled,
  onPlay,
  onPause,
  onSkip,
  onRestart,
  onToggleAutoQueue,
  onOpenSearch,
  onOpenVideo,
  roomCode,
}) => {
  const isHost = currentParticipant?.role === 'host';
  const track = playbackState.currentTrack;
  const isPlaying = playbackState.status === 'PLAYING';
  const playerRef = useRef<any>(null);
  const [localPlaying, setLocalPlaying] = useState<boolean>(isPlaying);

  useEffect(() => {
    setLocalPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current) {
      mobileAudioSyncEngine.registerPlayerRef(playerRef.current);
      if (isPlaying) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    }
  }, [track?.id, isPlaying]);

  // Instant 0ms Local Handlers for Play/Pause/Skip
  const handlePlayPress = () => {
    setLocalPlaying(true);
    try {
      playerRef.current?.playVideo?.();
    } catch (_) {}
    onPlay();
  };

  const handlePausePress = () => {
    setLocalPlaying(false);
    try {
      playerRef.current?.pauseVideo?.();
    } catch (_) {}
    onPause();
  };

  const handleSkipPress = () => {
    try {
      playerRef.current?.pauseVideo?.();
    } catch (_) {}
    onSkip();
  };

  const handleRestartPress = () => {
    try {
      playerRef.current?.seekTo?.(0, true);
    } catch (_) {}
    onRestart();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <View style={styles.card}>
      {/* Top Status Badges */}
      <View style={styles.topRow}>
        <View style={styles.syncBadge}>
          <View style={styles.syncDot} />
          <Zap size={12} color="#10b981" />
          <Text style={styles.syncText}>
            Speaker Sync: <Text style={styles.syncMs}>±{Math.abs(syncStats.estimatedDrift || 8)}ms</Text>
          </Text>
        </View>

        <View style={styles.rightBadges}>
          <View style={styles.adFreeBadge}>
            <ShieldCheck size={11} color="#10b981" />
            <Text style={styles.adFreeText}>Ad-Free</Text>
          </View>

          {track && onOpenVideo && (
            <TouchableOpacity onPress={onOpenVideo} style={styles.watchVideoBtn}>
              <Tv size={12} color="#ec4899" />
              <Text style={styles.watchVideoText}>Watch Video</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Center Content: Audio-First High-Res Artwork Deck */}
      <View style={styles.centerContent}>
        {track ? (
          <View style={styles.artworkWrapper}>
            <Image source={{ uri: track.thumbnail }} style={styles.artwork} resizeMode="cover" />
            <View style={styles.audioBadge}>
              <Radio size={11} color="#06b6d4" />
              <Text style={styles.audioBadgeText}>High-Fidelity Audio • Ad-Free</Text>
            </View>

            {/* Hardware-Accelerated Audio Engine Player keyed to track.id to prevent song audio bleed */}
            <View style={styles.hiddenAudioEngine}>
              <YoutubePlayer
                key={track.id}
                ref={(r: any) => {
                  playerRef.current = r;
                  if (r) mobileAudioSyncEngine.registerPlayerRef(r);
                }}
                height={2}
                width={2}
                play={localPlaying}
                videoId={track.id}
                baseUrl="https://www.youtube-nocookie.com"
                onReady={() => {
                  if (playerRef.current) {
                    mobileAudioSyncEngine.registerPlayerRef(playerRef.current);
                    if (localPlaying) {
                      playerRef.current.playVideo?.();
                    }
                  }
                }}
                onChangeState={(state: string) => {
                  if (state === 'ended') {
                    mobileSocketService.skipTrack(roomCode);
                  }
                }}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidLayerType: 'hardware',
                  javaScriptEnabled: true,
                  domStorageEnabled: true,
                  injectedJavaScript: AD_BLOCK_INJECTED_JS,
                }}
                initialPlayerParams={{
                  controls: false,
                  modestbranding: true,
                  rel: false,
                  playsinline: true,
                  preventFullScreen: true,
                  iv_load_policy: 3,
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noTrackContainer}>
            <View style={styles.discIconCircle}>
              <Music size={32} color="#8b5cf6" />
            </View>
            <Text style={styles.noTrackTitle}>No Track Playing</Text>
            <Text style={styles.noTrackSubtitle}>
              {isHost
                ? 'Search and pick any YouTube track to start the party!'
                : 'Suggest a track in live chat for the Host to play!'}
            </Text>

            {onOpenSearch && (
              <TouchableOpacity onPress={onOpenSearch} style={styles.searchPromptBtn}>
                <Search size={15} color="#fff" />
                <Text style={styles.searchPromptText}>Search & Play Song</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Track Title & Artist */}
        {track && (
          <View style={styles.infoContainer}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>
              {track.artist}
            </Text>
          </View>
        )}
      </View>

      {/* Animated Equalizer Waveform */}
      {track && <AudioVisualizer isPlaying={localPlaying} barCount={22} />}

      {/* Progress Bar */}
      {track && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}

      {/* Controls Bar */}
      <View style={styles.controlsRow}>
        {/* Auto Queue Toggle */}
        <TouchableOpacity
          onPress={onToggleAutoQueue}
          disabled={!isHost}
          style={[
            styles.autoQueueBtn,
            autoQueueEnabled ? styles.autoQueueBtnActive : styles.autoQueueBtnInactive,
          ]}
        >
          <Sparkles size={13} color={autoQueueEnabled ? '#06b6d4' : '#64748b'} />
          <Text style={[styles.autoQueueText, autoQueueEnabled && styles.autoQueueTextActive]}>
            Auto-Queue
          </Text>
        </TouchableOpacity>

        {/* Playback Controls with 0ms Latency Response */}
        {isHost ? (
          <View style={styles.hostControls}>
            <TouchableOpacity onPress={handleRestartPress} disabled={!track} style={styles.iconBtn}>
              <RotateCcw size={18} color={track ? '#94a3b8' : '#334155'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={localPlaying ? handlePausePress : handlePlayPress}
              disabled={!track}
              style={[styles.playBtn, !track && styles.playBtnDisabled]}
            >
              {localPlaying ? (
                <Pause size={22} color="#fff" fill="#fff" />
              ) : (
                <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkipPress} disabled={!track} style={styles.iconBtn}>
              <SkipForward size={20} color={track ? '#94a3b8' : '#334155'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listenerBadge}>
            <Crown size={13} color="#f59e0b" />
            <Text style={styles.listenerBadgeText}>Host is DJ 👑</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#13131d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27273d',
    padding: 14,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  syncText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  syncMs: {
    color: '#10b981',
    fontWeight: '700',
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adFreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  adFreeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  watchVideoText: {
    color: '#ec4899',
    fontSize: 10,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 6,
  },
  artworkWrapper: {
    width: 160,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27273d',
    backgroundColor: '#0f0f13',
    position: 'relative',
    marginBottom: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  audioBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 3,
    borderRadius: 8,
  },
  audioBadgeText: {
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: '700',
  },
  hiddenAudioEngine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 2,
    opacity: 0.05,
  },
  noTrackContainer: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#1b1b2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27273d',
    marginBottom: 8,
    gap: 6,
  },
  discIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noTrackTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  noTrackSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPromptText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    width: '100%',
  },
  trackTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  trackArtist: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#1e1e2d',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 99,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  autoQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  autoQueueBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  autoQueueBtnInactive: {
    backgroundColor: '#1b1b2a',
    borderColor: '#27273d',
  },
  autoQueueText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  autoQueueTextActive: {
    color: '#06b6d4',
  },
  hostControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnDisabled: {
    opacity: 0.4,
  },
  iconBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#1b1b2a',
  },
  listenerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1b1b2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27273d',
  },
  listenerBadgeText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
});
