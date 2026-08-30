import React from 'react';
import { ThumbsUp, Plus, Play, Check, X, Sparkles, Crown } from 'lucide-react';
import { SongSuggestion, Participant } from '../../types';

interface SuggestionCardProps {
  suggestion: SongSuggestion;
  currentParticipant: Participant | null;
  onUpvote: (suggestionId: string) => void;
  onResolve: (suggestionId: string, action: 'add_to_queue' | 'play_next' | 'reject') => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  currentParticipant,
  onUpvote,
  onResolve,
}) => {
  const isHost = currentParticipant?.role === 'host';
  const hasUpvoted = currentParticipant ? suggestion.upvotes.includes(currentParticipant.id) : false;
  const track = suggestion.track;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-br from-rave-surface to-slate-900 border border-rave-purple/30 shadow-lg glow-purple transition-all">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-rave-cyan font-medium">
          <Sparkles size={14} />
          <span>Song Suggestion</span>
        </div>
        <div className="text-[11px] text-slate-400">
          by <span className="text-slate-200 font-semibold">{suggestion.suggestedBy.name}</span>
        </div>
      </div>

      {/* Song Details Row */}
      <div className="flex items-center gap-3">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-14 h-14 rounded-xl object-cover border border-rave-border flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-100 truncate">{track.title}</h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
          <span className="inline-block text-[10px] text-slate-500 font-mono mt-1">
            ⏱️ {formatDuration(track.duration)} • YouTube
          </span>
        </div>

        {/* Upvote Button (Everyone can vote!) */}
        <button
          onClick={() => onUpvote(suggestion.id)}
          className={`flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-xl border transition ${
            hasUpvoted
              ? 'bg-rave-purple/30 border-rave-purple text-rave-purple shadow-sm'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ThumbsUp size={16} className={hasUpvoted ? 'fill-rave-purple' : ''} />
          <span className="text-xs font-bold mt-0.5">{suggestion.upvotes.length}</span>
        </button>
      </div>

      {/* Status or Host Actions Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        {suggestion.status === 'accepted' ? (
          <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-full justify-center">
            <Check size={14} /> Added to Playlist by Host
          </span>
        ) : suggestion.status === 'rejected' ? (
          <span className="flex items-center gap-1 text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 w-full justify-center">
            <X size={14} /> Declined by Host
          </span>
        ) : isHost ? (
          // HOST ONLY ACTIONS
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
              <Crown size={12} /> Host Actions:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onResolve(suggestion.id, 'play_next')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rave-cyan/20 hover:bg-rave-cyan/30 text-cyan-300 border border-rave-cyan/40 font-medium transition"
                title="Play Next after current song"
              >
                <Play size={12} fill="currentColor" /> Play Next
              </button>
              <button
                onClick={() => onResolve(suggestion.id, 'add_to_queue')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rave-purple/30 hover:bg-rave-purple/40 text-purple-300 border border-rave-purple/50 font-medium transition"
                title="Add to end of Queue"
              >
                <Plus size={13} /> Add to Queue
              </button>
              <button
                onClick={() => onResolve(suggestion.id, 'reject')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                title="Decline Suggestion"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">
            Waiting for Host approval ({suggestion.upvotes.length} upvotes)
          </span>
        )}
      </div>
    </div>
  );
};
