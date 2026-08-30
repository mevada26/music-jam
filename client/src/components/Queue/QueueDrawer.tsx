import React, { useState, useEffect } from 'react';
import { ListMusic, Trash2, Sparkles, History, Play, Music } from 'lucide-react';
import { Track, Participant } from '../../types';

interface QueueDrawerProps {
  queue: Track[];
  history: Track[];
  currentTrack: Track | null;
  currentParticipant: Participant | null;
  autoQueueEnabled: boolean;
  onRemoveFromQueue: (index: number) => void;
  onPlayTrack?: (track: Track) => void;
  onOpenSearch: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  history,
  currentTrack,
  currentParticipant,
  autoQueueEnabled,
  onRemoveFromQueue,
  onPlayTrack,
  onOpenSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const isHost = currentParticipant?.role === 'host';

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Fetch auto-queue predictions if queue is low
  useEffect(() => {
    if (!currentTrack || queue.length > 2) return;

    fetch(`/api/recommendations/${currentTrack.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendations) {
          setRecommendations(data.recommendations.slice(0, 4));
        }
      })
      .catch(() => {});
  }, [currentTrack, queue.length]);

  return (
    <div className="flex flex-col h-full bg-rave-card rounded-3xl border border-rave-border shadow-xl overflow-hidden">
      {/* Header Tabs */}
      <div className="p-3 border-b border-rave-border bg-rave-surface/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-rave-bg border border-rave-border">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'queue'
                ? 'bg-rave-purple text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic size={14} />
            <span>Up Next ({queue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-rave-purple text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} />
            <span>History ({history.length})</span>
          </button>
        </div>

        {/* Add Songs trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rave-surface hover:bg-slate-800 border border-rave-border text-slate-300 transition"
        >
          <Music size={13} />
          <span>Add Songs</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'queue' ? (
          <>
            {/* Active Queue List */}
            {queue.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-500">
                <ListMusic size={36} className="text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">Queue is currently empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  {autoQueueEnabled
                    ? 'Smart Auto-Queue will automatically play recommended songs!'
                    : 'Search songs or accept suggestions to build queue'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-rave-surface/50 border border-rave-border/60 hover:border-rave-purple/40 transition group"
                  >
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                      {idx + 1}
                    </span>

                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover border border-rave-border flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{track.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{track.artist}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ⏱️ {formatDuration(track.duration)}
                      </span>
                    </div>

                    {isHost && (
                      <button
                        onClick={() => onRemoveFromQueue(idx)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove from Queue"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Smart Auto-Queue Recommendations Section */}
            {autoQueueEnabled && recommendations.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rave-cyan mb-2.5">
                  <Sparkles size={14} />
                  <span>Auto-Queue Up Next (Recommended by Algorithm)</span>
                </div>

                <div className="space-y-2 opacity-80 hover:opacity-100 transition">
                  {recommendations.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{track.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                      </div>
                      {isHost && onPlayTrack && (
                        <button
                          onClick={() => onPlayTrack(track)}
                          className="p-1.5 rounded-lg bg-rave-purple/20 text-rave-purple hover:bg-rave-purple/30 transition"
                          title="Play Immediately"
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* History Tab */
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-500">
                <History size={36} className="text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No tracks in history yet</p>
              </div>
            ) : (
              history.map((track, idx) => (
                <div
                  key={`hist-${track.id}-${idx}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-rave-surface/40 border border-rave-border/40 text-xs"
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-300 truncate">{track.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{track.artist}</p>
                  </div>
                  {isHost && onPlayTrack && (
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rave-purple text-slate-300 hover:text-white transition"
                      title="Replay Track"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
