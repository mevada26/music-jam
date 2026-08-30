import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, barCount = 24 }) => {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10 px-4">
      {Array.from({ length: barCount }).map((_, i) => {
        // Pseudo-randomized heights for realistic equalizer feel
        const delay = (i % 6) * 0.15;
        const duration = 0.6 + (i % 4) * 0.2;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-rave-purple via-rave-pink to-rave-cyan shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                : 'bg-slate-700/50 h-1.5'
            }`}
            style={
              isPlaying
                ? {
                    animation: `wave-bounce ${duration}s ease-in-out ${delay}s infinite alternate`,
                    height: `${20 + ((i * 7) % 80)}%`,
                  }
                : { height: '6px' }
            }
          />
        );
      })}
    </div>
  );
};
