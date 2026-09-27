import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, RefreshCw, Volume2 } from 'lucide-react';
import { launchFireworks, launchConfetti } from '../ui/confetti.js';
import { playBlowoutSound, playChime } from '../../lib/audio/sfx.js';

export type CakeFlavor = 'strawberry' | 'chocolate' | 'rainbow' | 'caramel';

interface CakeProps {
  birthdayName: string;
  age?: number;
  candlesCount?: number;
  flavor?: CakeFlavor;
  showFlavorPicker?: boolean;
  blowoutCelebration?: 'fireworks' | 'confetti' | 'stars';
  onBlownOut?: () => void;
}

interface FlavorTheme {
  name: string;
  topIcing: string;
  dripColor: string;
  cakeBody: string;
  frostingSwirl: string;
  topperFruit: string;
  plateColor: string;
  candleStripes: string[];
}

const FLAVORS: Record<CakeFlavor, FlavorTheme> = {
  strawberry: {
    name: 'Strawberry Velvet',
    topIcing: 'from-pink-400 via-rose-300 to-pink-500',
    dripColor: '#fb7185',
    cakeBody: 'from-rose-900 via-pink-900 to-rose-950',
    frostingSwirl: '#ffe4e6',
    topperFruit: '#e11d48',
    plateColor: 'from-slate-200 via-white to-slate-300',
    candleStripes: ['#fb7185', '#ffffff']
  },
  chocolate: {
    name: 'Belgian Truffle',
    topIcing: 'from-amber-950 via-stone-900 to-neutral-950',
    dripColor: '#3e2723',
    cakeBody: 'from-stone-900 via-stone-950 to-neutral-950',
    frostingSwirl: '#d7ccc8',
    topperFruit: '#f59e0b',
    plateColor: 'from-amber-200 via-amber-100 to-amber-300',
    candleStripes: ['#f59e0b', '#78350f']
  },
  rainbow: {
    name: 'Carnival Confetti',
    topIcing: 'from-sky-300 via-pink-300 to-purple-300',
    dripColor: '#ec4899',
    cakeBody: 'from-indigo-950 via-purple-950 to-pink-950',
    frostingSwirl: '#ffffff',
    topperFruit: '#38bdf8',
    plateColor: 'from-purple-200 via-white to-pink-200',
    candleStripes: ['#ec4899', '#38bdf8']
  },
  caramel: {
    name: 'Caramel & Gold',
    topIcing: 'from-amber-500 via-amber-400 to-yellow-500',
    dripColor: '#b45309',
    cakeBody: 'from-amber-950 via-stone-900 to-amber-900',
    frostingSwirl: '#fef3c7',
    topperFruit: '#d97706',
    plateColor: 'from-yellow-100 via-amber-50 to-yellow-200',
    candleStripes: ['#f59e0b', '#ffffff']
  }
};

export const InteractiveCake: React.FC<CakeProps> = ({
  birthdayName,
  age,
  candlesCount = 3,
  flavor: propFlavor = 'chocolate',
  showFlavorPicker = false,
  onBlownOut
}) => {
  const actualCandleCount = Math.min(Math.max(candlesCount, 1), 7);
  const [candlesLit, setCandlesLit] = useState<boolean[]>(Array(actualCandleCount).fill(true));
  const [flavor, setFlavor] = useState<CakeFlavor>((propFlavor as CakeFlavor) || 'chocolate');

  useEffect(() => {
    if (propFlavor && FLAVORS[propFlavor]) {
      setFlavor(propFlavor);
    }
  }, [propFlavor]);
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const allCandlesBlown = candlesLit.every((lit) => !lit);

  // Handle single candle click
  const toggleCandle = (index: number) => {
    if (!candlesLit[index]) return;
    const next = [...candlesLit];
    next[index] = false;
    setCandlesLit(next);
    playBlowoutSound();

    if (next.every((c) => !c)) {
      launchFireworks();
      launchConfetti();
      if (onBlownOut) onBlownOut();
    } else {
      launchConfetti();
    }
  };

  // Blow out all candles at once
  const triggerBlowoutAll = () => {
    if (allCandlesBlown) return;
    setCandlesLit(Array(actualCandleCount).fill(false));
    stopListening();
    playBlowoutSound();
    launchFireworks();
    launchConfetti();
    if (onBlownOut) onBlownOut();
  };

  const relightCandles = () => {
    setCandlesLit(Array(actualCandleCount).fill(true));
    playChime(784);
  };

  // Microphone breath blowout detection
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

        let sum = 0;
        for (let i = 0; i < 20; i++) {
          sum += dataArray[i];
        }
        const avg = sum / 20;
        setMicVolume(Math.min(100, Math.round((avg / 160) * 100)));

        // Blow detection threshold
        if (avg > 130) {
          triggerBlowoutAll();
        } else {
          requestAnimationFrame(checkBlow);
        }
      };

      requestAnimationFrame(checkBlow);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setMicVolume(0);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const currentTheme = FLAVORS[flavor];

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-xl mx-auto select-none text-center animate-fadeIn">
      {/* Flavor Selector Chips (Editor Only) */}
      {showFlavorPicker && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 max-w-md">
          {(Object.keys(FLAVORS) as CakeFlavor[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFlavor(f);
                playChime(659);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                flavor === f
                  ? 'bg-white text-zinc-950 font-bold shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {FLAVORS[f].name}
            </button>
          ))}
        </div>
      )}

      {/* 3D Realistic Gourmet Cake Stage */}
      <div className="relative w-full max-w-[380px] h-[340px] flex flex-col items-center justify-end mb-6">
        {/* Candle Glow Ambient Halo */}
        {!allCandlesBlown && (
          <div className="absolute top-4 w-72 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        )}

        {/* CANDLES ROW */}
        <div className="relative z-30 flex justify-center items-end gap-4 sm:gap-6 mb-[-12px]">
          {candlesLit.map((isLit, i) => (
            <div
              key={i}
              onClick={() => toggleCandle(i)}
              className="group cursor-pointer flex flex-col items-center transition-transform hover:scale-110 relative"
              title="Click or blow to extinguish this candle"
            >
              {/* Flame or Smoke */}
              <div className="h-14 flex items-end justify-center relative w-10">
                {isLit ? (
                  <div className="relative flex flex-col items-center animate-flame">
                    {/* Outer Flame Glow */}
                    <div className="w-5 h-8 bg-gradient-to-t from-amber-500 via-yellow-400 to-transparent rounded-full filter blur-[1px]" />
                    {/* Inner White-Hot Core */}
                    <div className="absolute bottom-1 w-2.5 h-5 bg-gradient-to-t from-yellow-100 to-white rounded-full shadow-[0_0_8px_#ffffff]" />
                    {/* Blue Base Mantle */}
                    <div className="absolute bottom-0 w-2 h-2 bg-blue-500 rounded-full opacity-70 filter blur-[0.5px]" />
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center">
                    {/* Smoke Puff */}
                    <div className="animate-smoke text-zinc-400/80 text-xl font-bold select-none">
                      ~
                    </div>
                    {/* Glowing Ember Wick */}
                    <div className="w-1.5 h-2 bg-red-600 rounded-full animate-ping opacity-80" />
                  </div>
                )}
              </div>

              {/* Candle Wick */}
              <div className="w-0.5 h-2.5 bg-zinc-800 -mb-0.5" />

              {/* Tapered Wax Candle Body */}
              <div
                className="w-3.5 h-14 rounded-t-sm shadow-lg border-x border-white/20 relative overflow-hidden"
                style={{
                  background: `repeating-linear-gradient(45deg, ${currentTheme.candleStripes[0]}, ${currentTheme.candleStripes[0]} 4px, ${currentTheme.candleStripes[1]} 4px, ${currentTheme.candleStripes[1]} 8px)`
                }}
              >
                {/* Wax Melt Droplet */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-white/70 rounded-full shadow-inner" />
              </div>
            </div>
          ))}
        </div>

        {/* TIER 1: TOP CAKE (Gourmet Glazed Cylindrical Layer) */}
        <div className="relative z-20 w-56 flex flex-col items-center">
          {/* Buttercream Swirls & Cherries on Rim */}
          <div className="w-full flex justify-between px-2 -mb-2.5 relative z-30">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Candied Cherry / Gold Pearl */}
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-md transition-transform hover:scale-125"
                  style={{
                    backgroundColor: currentTheme.topperFruit,
                    boxShadow: `0 0 6px ${currentTheme.topperFruit}`
                  }}
                />
                {/* Piped Cream Rosette */}
                <div
                  className="w-4 h-3 rounded-t-full shadow-sm -mt-0.5"
                  style={{ backgroundColor: currentTheme.frostingSwirl }}
                />
              </div>
            ))}
          </div>

          {/* Top Tier Oval Surface */}
          <div
            className={`w-full h-16 rounded-t-[50%] bg-gradient-to-r ${currentTheme.topIcing} shadow-lg border-t-2 border-white/30 flex items-center justify-center relative overflow-hidden`}
          >
            {/* Glossy Sheen Highlight */}
            <div className="absolute top-1 inset-x-6 h-5 bg-white/25 rounded-full filter blur-[2px]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-10 font-mono">
              {age ? `★ ${age} Years ★` : '★ Happy Birthday ★'}
            </span>
          </div>

          {/* Top Tier Wavy Drips */}
          <div className="w-full -mt-2 relative z-20 flex justify-around px-2">
            {[7, 12, 9, 14, 8, 13, 7].map((len, idx) => (
              <div
                key={idx}
                className="w-3 rounded-b-full shadow-md"
                style={{
                  height: `${len}px`,
                  backgroundColor: currentTheme.dripColor
                }}
              />
            ))}
          </div>
        </div>

        {/* TIER 2: BASE CAKE (Grand Sponge Body with Chocolate Nameplate) */}
        <div className="relative z-10 w-72 flex flex-col items-center -mt-3">
          {/* Base Rim Frosting Rosettes */}
          <div className="w-full flex justify-between px-3 -mb-2 relative z-20">
            {[...Array(9)].map((_, idx) => (
              <div
                key={idx}
                className="w-3.5 h-3 rounded-t-full shadow-sm"
                style={{ backgroundColor: currentTheme.frostingSwirl }}
              />
            ))}
          </div>

          {/* Base Cake Cylinder Body */}
          <div
            className={`w-full h-24 rounded-t-xl rounded-b-2xl bg-gradient-to-b ${currentTheme.cakeBody} shadow-2xl border-t border-white/20 flex flex-col items-center justify-center relative overflow-hidden px-4`}
          >
            {/* Elegant Chocolate Plaque with Recipient's Name */}
            <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border border-amber-400/60 rounded-xl px-6 py-2.5 shadow-2xl flex items-center justify-center z-10 max-w-[220px]">
              <span className="font-serif font-extrabold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-md truncate max-w-[200px]">
                {birthdayName}
              </span>
            </div>

            {/* Sprinkles on Base */}
            <div className="absolute bottom-2 inset-x-4 flex justify-between opacity-60">
              {[...Array(12)].map((_, idx) => (
                <div
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: ['#f43f5e', '#fbbf24', '#38bdf8', '#34d399', '#ec4899'][idx % 5]
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ELEGANT CERAMIC PEDESTAL STAND */}
        <div className="relative w-80 flex flex-col items-center -mt-2 z-0">
          {/* Porcelain Plate Rim */}
          <div
            className={`w-full h-6 rounded-full bg-gradient-to-r ${currentTheme.plateColor} shadow-2xl border-t border-white/50 border-b-2 border-slate-400 flex items-center justify-center`}
          >
            <div className="w-[92%] h-2 rounded-full bg-white/40 filter blur-[1px]" />
          </div>
          {/* Pedestal Base */}
          <div className="w-28 h-5 bg-gradient-to-b from-slate-300 to-slate-400 rounded-b-xl shadow-lg border-x border-slate-400" />
          <div className="w-40 h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-full shadow-2xl" />
        </div>
      </div>

      {/* INTERACTIVE CONTROLS */}
      {!allCandlesBlown ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <p className="text-xs sm:text-sm font-medium text-amber-200/90 animate-pulse">
            Make a wish! Tap any candle or blow into your mic.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerBlowoutAll}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white rounded-full font-bold shadow-xl shadow-pink-500/25 transition-all transform hover:scale-105 flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" /> Blow Out All Candles
            </button>

            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-full border transition-all ${
                isListening
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
              title={isListening ? 'Listening for breath...' : 'Enable microphone to blow out'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Mic Sound Meter when Active */}
          {isListening && (
            <div className="w-48 bg-zinc-900 border border-zinc-700 rounded-full p-1 flex items-center gap-2 animate-fadeIn">
              <span className="text-[10px] font-mono text-zinc-400 pl-2">Breath:</span>
              <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all duration-75"
                  style={{ width: `${micVolume}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <div className="text-xl sm:text-2xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-rose-300 drop-shadow-md">
            Wishes Released to the Universe! ✨🎂
          </div>
          <p className="text-xs text-zinc-300 max-w-xs">
            Every flame carried your silent wish into the starlight.
          </p>
          <button
            onClick={relightCandles}
            className="mt-2 text-xs text-amber-300/80 hover:text-amber-200 flex items-center gap-1.5 transition-colors font-medium border border-amber-400/20 px-3 py-1.5 rounded-full bg-amber-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Light the candles again
          </button>
        </div>
      )}
    </div>
  );
};
