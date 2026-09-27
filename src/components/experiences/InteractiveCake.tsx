import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, Mic, RefreshCw } from 'lucide-react';
import { launchFireworks } from '../ui/confetti.js';

interface CakeProps {
  birthdayName: string;
  age?: number;
  candlesCount?: number;
  blowoutCelebration?: 'fireworks' | 'confetti' | 'stars';
  onBlownOut?: () => void;
}

export const InteractiveCake: React.FC<CakeProps> = ({
  birthdayName,
  age,
  candlesCount = 3,
  onBlownOut
}) => {
  const [isBlownOut, setIsBlownOut] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [candlesLit, setCandlesLit] = useState<boolean[]>(Array(candlesCount).fill(true));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Handle blowout event
  const triggerBlowout = () => {
    if (isBlownOut) return;
    setCandlesLit(Array(candlesCount).fill(false));
    setIsBlownOut(true);
    stopListening();
    launchFireworks();
    if (onBlownOut) onBlownOut();
  };

  const relightCandles = () => {
    setCandlesLit(Array(candlesCount).fill(true));
    setIsBlownOut(false);
  };

  // Optional microphone blow detection
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkBlow = () => {
        if (!analyserRef.current || !micStreamRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Low frequency air rushing energy
        let lowFreqSum = 0;
        for (let i = 0; i < 15; i++) {
          lowFreqSum += dataArray[i];
        }
        const avg = lowFreqSum / 15;

        // If strong breath sound detected
        if (avg > 140) {
          triggerBlowout();
        } else {
          requestAnimationFrame(checkBlow);
        }
      };

      requestAnimationFrame(checkBlow);
    } catch {
      // Fallback: tap only
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        {/* Candles */}
        <div className="flex justify-center items-end gap-5 mb-1">
          {candlesLit.map((lit, i) => (
            <div key={i} className="flex flex-col items-center">
              {lit ? (
                <div 
                  onClick={triggerBlowout}
                  className="cursor-pointer transition-transform hover:scale-125 animate-pulse"
                  title="Click to blow out candle"
                >
                  <Flame className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                </div>
              ) : (
                <div className="h-8 flex items-center">
                  <div className="w-1.5 h-3 bg-zinc-600 rounded-full animate-bounce opacity-60" />
                </div>
              )}
              {/* Candle Body */}
              <div className="w-3.5 h-12 bg-gradient-to-b from-pink-300 via-rose-400 to-indigo-500 rounded-t-sm shadow-md border-x border-white/20" />
            </div>
          ))}
        </div>

        {/* Cake Layer 1 (Top) */}
        <div className="relative z-10 w-48 h-14 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 rounded-t-2xl shadow-lg border-b-4 border-pink-500/30 flex items-center justify-center">
          <div className="text-xs tracking-widest text-pink-900 font-bold uppercase drop-shadow-sm">
            {age ? `${age} & Fabulous` : 'Sweet Birthday'}
          </div>
          {/* Frosting drips */}
          <div className="absolute -bottom-2 inset-x-2 flex justify-between px-1">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="w-4 h-3 bg-rose-300 rounded-b-full shadow-sm" />
            ))}
          </div>
        </div>

        {/* Cake Layer 2 (Base) */}
        <div className="relative w-64 h-20 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 rounded-b-xl shadow-2xl border-t border-amber-300/40 flex items-center justify-center -mt-1">
          <span className="text-amber-900 font-serif font-bold text-lg tracking-wider">
            {birthdayName}
          </span>
        </div>

        {/* Cake Stand Plate */}
        <div className="w-72 h-4 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 rounded-full shadow-2xl mx-auto -mt-1 border border-zinc-400/30" />
      </div>

      {/* Status & Action */}
      {!isBlownOut ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-zinc-300 animate-pulse">
            Make a silent wish and blow out the candles!
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={triggerBlowout}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-full font-medium shadow-lg hover:shadow-pink-500/25 transition-all flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Tap to Blow Out
            </button>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-full border transition-all ${
                isListening
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-ping'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
              title={isListening ? 'Microphone listening (Blow gently into your mic!)' : 'Enable microphone to blow out'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          {isListening && (
            <span className="text-xs text-rose-300">
              Microphone listening... blow into your mic!
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 animate-fadeIn">
          <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">
            May all your deepest wishes come true! ✨
          </div>
          <button
            onClick={relightCandles}
            className="mt-2 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Light the candles again
          </button>
        </div>
      )}
    </div>
  );
};
