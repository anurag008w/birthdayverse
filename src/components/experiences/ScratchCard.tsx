import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Eye } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';
import { playScratchSound, playChime } from '../../lib/audio/sfx.js';

interface ScratchCardProps {
  headline: string;
  hiddenMessage: string;
  coverText?: string;
  thresholdPercent?: number;
  onRevealed?: () => void;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  headline,
  hiddenMessage,
  coverText = 'Scratch with finger or mouse to reveal your surprise!',
  thresholdPercent = 45,
  onRevealed
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastSoundRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw silver foil with sparkle pattern
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Diagonal metallic sheen
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#64748b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH HERE ✨', canvas.width / 2, canvas.height / 2);
  }, []);

  const scratch = (clientX: number, clientY: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sound effect with throttle
    const now = Date.now();
    if (now - lastSoundRef.current > 120) {
      lastSoundRef.current = now;
      playScratchSound();
    }

    checkPercentScratched();
  };

  const checkPercentScratched = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample pixels every 10 pixels for performance
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentCount = 0;
    const totalPixels = data.length / 4;

    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) {
        transparentCount++;
      }
    }

    const ratio = (transparentCount / (totalPixels / 4)) * 100;
    if (ratio >= thresholdPercent) {
      triggerFullReveal();
    }
  };

  const triggerFullReveal = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    playChime(1046.5); // High crystal chime
    launchConfetti();
    if (onRevealed) onRevealed();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto select-none">
      <div className="relative w-80 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6 text-center">
        {/* Hidden Content underneath */}
        <div className="text-white space-y-2">
          <div className="flex justify-center text-amber-300">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="font-bold text-lg text-amber-200">{headline}</h4>
          <p className="text-sm text-pink-100 font-medium leading-relaxed">
            {hiddenMessage}
          </p>
        </div>

        {/* Scratch Canvas on top */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            width={320}
            height={176}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            onMouseMove={(e) => {
              if (isDrawing) scratch(e.clientX, e.clientY);
            }}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={() => setIsDrawing(false)}
            onTouchMove={(e) => {
              if (e.touches[0]) {
                scratch(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
          />
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-xs text-zinc-400 text-center">{coverText}</p>
        {!isRevealed && (
          <button
            onClick={triggerFullReveal}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors underline"
          >
            <Eye className="w-3.5 h-3.5" /> Skip & Reveal
          </button>
        )}
      </div>
    </div>
  );
};
