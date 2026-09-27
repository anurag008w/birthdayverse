import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';

interface ConstellationProps {
  starName: string;
  revealMessage?: string;
  onCompleted?: () => void;
}

interface StarNode {
  id: number;
  x: number;
  y: number;
  label?: string;
  connected: boolean;
}

export const ConstellationCanvas: React.FC<ConstellationProps> = ({
  starName,
  revealMessage = 'A constellation created forever in your honor.',
  onCompleted
}) => {
  const [stars, setStars] = useState<StarNode[]>([]);
  const [completed, setCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize stars forming a curved constellation arc
  useEffect(() => {
    const letters = starName.toUpperCase().split('');
    const count = Math.max(5, letters.length);
    const newStars: StarNode[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / (count - 1)) * Math.PI * 0.8 + 0.35;
      const radiusX = 140;
      const radiusY = 70;
      const x = 180 + Math.cos(angle) * radiusX;
      const y = 140 - Math.sin(angle) * radiusY + (i % 2 === 0 ? -15 : 15);

      newStars.push({
        id: i,
        x,
        y,
        label: letters[i] || '★',
        connected: false
      });
    }

    setStars(newStars);
  }, [starName]);

  const connectNextStar = (id: number) => {
    if (completed) return;
    setStars(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, connected: true } : s));
      const allConnected = updated.every(s => s.connected);
      if (allConnected) {
        setCompleted(true);
        launchConfetti(undefined, undefined, 'star');
        if (onCompleted) onCompleted();
      }
      return updated;
    });
  };

  const connectAll = () => {
    setStars(prev => prev.map(s => ({ ...s, connected: true })));
    setCompleted(true);
    launchConfetti(undefined, undefined, 'star');
    if (onCompleted) onCompleted();
  };

  // Draw lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connected constellation glow lines
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 10;

    let hasStarted = false;
    for (const star of stars) {
      if (star.connected) {
        if (!hasStarted) {
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          hasStarted = true;
        } else {
          ctx.lineTo(star.x, star.y);
        }
      }
    }
    if (hasStarted) {
      ctx.stroke();
    }
  }, [stars]);

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto select-none">
      <div className="relative w-[360px] h-[260px] bg-slate-950/80 rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Ambient twinkling background stars */}
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-ping"
            style={{
              top: `${(i * 19) % 95}%`,
              left: `${(i * 31) % 95}%`,
              animationDuration: `${2 + (i % 3)}s`
            }}
          />
        ))}

        {/* Lines canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={260}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Clickable Star Nodes */}
        {stars.map((s) => (
          <button
            key={s.id}
            onClick={() => connectNextStar(s.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all p-2 rounded-full flex flex-col items-center group ${
              s.connected ? 'scale-125' : 'hover:scale-125'
            }`}
            style={{ left: s.x, top: s.y }}
          >
            <Star
              className={`w-6 h-6 transition-all ${
                s.connected
                  ? 'text-indigo-300 fill-indigo-300 drop-shadow-[0_0_15px_#818cf8]'
                  : 'text-zinc-500 group-hover:text-indigo-400'
              }`}
            />
            <span
              className={`text-[10px] font-bold mt-0.5 tracking-tighter ${
                s.connected ? 'text-indigo-200' : 'text-zinc-500'
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center">
        {!completed ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-indigo-300 font-medium">
              Tap the stars to connect the constellation of {starName}!
            </p>
            <button
              onClick={connectAll}
              className="text-xs text-zinc-400 hover:text-white underline transition-colors"
            >
              Connect All Stars
            </button>
          </div>
        ) : (
          <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 animate-fadeIn">
            {revealMessage} ✨
          </div>
        )}
      </div>
    </div>
  );
};
