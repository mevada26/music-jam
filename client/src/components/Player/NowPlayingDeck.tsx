import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  Sparkles,
  Zap,
  Radio,
  Clock,
  Crown,
} from 'lucide-react';
import { PlaybackState, Participant, SyncStats } from '../../types';
import { AudioVisualizer } from './AudioVisualizer';

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
  onSeek: (seconds: number) => void;
  onToggleAutoQueue: () => void;
  onOpenVideo: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isMuted: boolean;
  volume: number;
}

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
  onSeek,
  onToggleAutoQueue,
  onOpenVideo,
  onVolumeChange,
  onToggleMute,
  isMuted,
  volume,
}) => {
  const isHost = currentParticipant?.role === 'host';
  const track = playbackState.currentTrack;
  const isPlaying = playbackState.status === 'PLAYING';

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-rave-card border border-rave-border shadow-2xl p-5 md:p-7 transition-all">
      {/* Ambient background glow from artwork */}
      {track && (
        <div
          className="absolute -top-24 -left-24 -right-24 h-72 opacity-25 blur-3xl pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: `radial-gradient(circle, #8b5cf6 0%, #ec4899 50%, transparent 80%)`,
          }}
        />
      )}

      {/* Top Status Badges */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
        {/* Speaker Sync Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Zap size={13} className="text-emerald-400" />
            Speaker Sync: <span className="text-emerald-400 font-mono">±{Math.abs(syncStats.estimatedDrift || 8)}ms</span>
          </span>
        </div>

        {/* Watch Video Button */}
        {track && (
          <button
            onClick={onOpenVideo}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rave-purple/20 to-rave-pink/20 hover:from-rave-purple/40 hover:to-rave-pink/40 border border-rave-purple/40 text-purple-300 transition shadow-sm hover:scale-105"
          >
            <Tv size={14} className="text-rave-pink" />
            <span>Watch Video</span>
          </button>
        )}
      </div>

      {/* Main Player Core */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Album Artwork / Thumbnail */}
        <div className="relative group w-44 h-44 sm:w-52 sm:h-52 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl border border-rave-border/80 bg-slate-900">
          {track ? (
            <>
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

              {/* Floating Equalizer Badge */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-rave-cyan">
                  <Radio size={12} className="animate-pulse" />
                  Audio Mode
                </span>
                <span className="text-slate-400">{formatTime(track.duration)}</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Radio size={36} className="animate-pulse text-slate-600" />
              <span className="text-xs font-medium">No track playing</span>
            </div>
          )}
        </div>

        {/* Track Info & Scrubber & Controls */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rave-purple/20 text-rave-purple border border-rave-purple/30">
                YouTube Music
              </span>
              {track?.suggestedBy && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  Suggested by <strong className="text-slate-200">{track.suggestedBy.name}</strong>
                </span>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-bold text-slate-100 line-clamp-1 leading-tight">
              {track ? track.title : 'Ready to start party'}
            </h2>
            <p className="text-sm font-medium text-slate-400 line-clamp-1 mt-0.5">
              {track ? track.artist : 'Suggest a song in chat or search to play'}
            </p>
          </div>

          {/* Equalizer Waveform */}
          <div className="w-full py-1">
            <AudioVisualizer isPlaying={isPlaying} barCount={28} />
          </div>

          {/* Scrubber Bar */}
          <div className="space-y-1.5">
            <div className="relative w-full h-2 rounded-full bg-slate-800 cursor-pointer overflow-hidden group">
              <div
                className="h-full bg-gradient-to-r from-rave-purple via-rave-pink to-rave-cyan rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
              {isHost && (
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime || 0}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              )}
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-1">
            {/* Host auto-queue button */}
            <button
              onClick={onToggleAutoQueue}
              disabled={!isHost}
              title={isHost ? 'Toggle Auto-Queue' : 'Auto-Queue is managed by Host'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                autoQueueEnabled
                  ? 'bg-rave-cyan/15 border-rave-cyan/40 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400'
              } ${!isHost ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <Sparkles size={14} className={autoQueueEnabled ? 'text-rave-cyan' : 'text-slate-500'} />
              <span>Auto-Queue</span>
            </button>

            {/* Playback action buttons (Host authority) */}
            <div className="flex items-center gap-3">
              {isHost ? (
                <>
                  <button
                    onClick={onRestart}
                    disabled={!track}
                    className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                    title="Restart Track"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={!track}
                    className="p-4 rounded-full bg-gradient-to-tr from-rave-purple to-rave-pink text-white hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition shadow-lg shadow-rave-purple/30 glow-purple"
                  >
                    {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
                  </button>

                  <button
                    onClick={onSkip}
                    disabled={!track}
                    className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                    title="Skip Track"
                  >
                    <SkipForward size={20} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/70 text-xs text-slate-300">
                  <Crown size={14} className="text-amber-400" />
                  <span>Host is controlling playback</span>
                </div>
              )}
            </div>

            {/* Volume / Mute Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="p-2 rounded-lg text-slate-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="w-16 sm:w-24 h-1.5 rounded-lg bg-slate-800 accent-rave-purple cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
