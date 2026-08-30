import React from 'react';
import { X, ExternalLink, Maximize2 } from 'lucide-react';
import { Track } from '../../types';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, track, currentTime }) => {
  if (!isOpen || !track) return null;

  const startSecond = Math.max(0, Math.floor(currentTime));
  const embedUrl = `https://www.youtube.com/embed/${track.id}?autoplay=1&start=${startSecond}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-rave-card rounded-2xl border border-rave-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-rave-border bg-rave-surface/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              LIVE VIDEO
            </span>
            <h3 className="font-semibold text-sm text-slate-100 truncate">{track.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={track.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Open in YouTube"
            >
              <ExternalLink size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Embed Frame */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={track.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-rave-card flex items-center justify-between text-xs text-slate-400">
          <span>Synced at {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
          <span>Switch back to Audio Mode anytime</span>
        </div>
      </div>
    </div>
  );
};
