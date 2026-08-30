import React, { useState, useEffect } from 'react';
import { Search, X, Music, Play, Plus, Loader2, Sparkles } from 'lucide-react';
import { Track, Participant } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipant: Participant | null;
  onPlayNow?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onSuggestSong: (track: Track) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  currentParticipant,
  onPlayNow,
  onAddToQueue,
  onSuggestSong,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHost = currentParticipant?.role === 'host';

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.tracks) {
          setResults(data.tracks);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-rave-card rounded-3xl border border-rave-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header & Search Bar */}
        <div className="p-5 border-b border-rave-border bg-rave-surface/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rave-purple/20 text-rave-purple">
                <Music size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Search YouTube Tracks</h3>
                <p className="text-xs text-slate-400">
                  {isHost
                    ? 'Play immediately, queue, or suggest tracks'
                    : 'Suggest any track directly to the live room chat'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, remix, lo-fi beats..."
              className="w-full bg-rave-bg border border-rave-border rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rave-purple focus:ring-1 focus:ring-rave-purple transition"
            />
            {isLoading && (
              <Loader2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rave-purple animate-spin" />
            )}
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {results.length === 0 && !isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
              <Sparkles size={36} className="text-rave-purple/40 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">
                {query ? 'No matching tracks found' : 'Type to search YouTube music'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Millions of songs available completely free</p>
            </div>
          )}

          {results.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-rave-surface/50 hover:bg-rave-surface border border-rave-border/60 hover:border-rave-purple/40 transition group"
            >
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-16 h-16 rounded-xl object-cover border border-rave-border flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-rave-purple transition">
                  {track.title}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
                <span className="inline-block text-[11px] text-slate-500 font-mono mt-1">
                  ⏱️ {formatDuration(track.duration)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isHost && onPlayNow && (
                  <button
                    onClick={() => {
                      onPlayNow(track);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rave-purple to-rave-pink text-white text-xs font-semibold shadow-md hover:scale-105 transition"
                    title="Play Now"
                  >
                    <Play size={12} fill="white" />
                    <span>Play</span>
                  </button>
                )}

                {isHost && onAddToQueue && (
                  <button
                    onClick={() => {
                      onAddToQueue(track);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:scale-105 transition"
                    title="Add to Queue"
                  >
                    <Plus size={16} />
                  </button>
                )}

                <button
                  onClick={() => {
                    onSuggestSong(track);
                    onClose();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isHost
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-gradient-to-r from-rave-purple to-rave-pink text-white border-transparent shadow-md glow-purple hover:scale-105'
                  }`}
                  title="Suggest to Room Chat"
                >
                  <Sparkles size={13} />
                  <span>Suggest</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
