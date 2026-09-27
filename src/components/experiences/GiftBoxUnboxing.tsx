import React, { useState } from 'react';
import { Gift, Sparkles, Heart } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';

interface GiftBoxProps {
  surpriseHeadline: string;
  surpriseMessage: string;
  stages?: Array<{
    title: string;
    description: string;
  }>;
}

export const GiftBoxUnboxing: React.FC<GiftBoxProps> = ({
  surpriseHeadline,
  surpriseMessage,
  stages = []
}) => {
  const [unboxed, setUnboxed] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);

  const handleOpen = () => {
    if (!unboxed) {
      setUnboxed(true);
      launchConfetti(undefined, undefined, 'star');
    }
  };

  const handleNextStage = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto select-none">
      {!unboxed ? (
        <div
          onClick={handleOpen}
          className="group cursor-pointer flex flex-col items-center gap-4 transition-transform hover:scale-105"
        >
          {/* 3D Gift Box Visual */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Box Body */}
            <div className="w-36 h-36 bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 rounded-2xl shadow-[0_20px_50px_rgba(244,63,94,0.35)] relative overflow-hidden border border-rose-300/30">
              {/* Ribbon Vertical */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 shadow-md" />
              {/* Ribbon Horizontal */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-300 shadow-md" />
            </div>

            {/* Box Lid with Bow */}
            <div className="absolute -top-3 w-40 h-10 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400 rounded-t-xl shadow-lg border-b-2 border-rose-800/40 flex items-center justify-center">
              {/* Ribbon Bow on Lid */}
              <div className="absolute -top-5 flex items-center justify-center text-amber-300">
                <Gift className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] animate-bounce" />
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500/20 text-rose-200 text-sm font-semibold border border-rose-400/40 group-hover:bg-rose-500/30 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-300" /> Tap to Unwrap Your Gift
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full bg-gradient-to-br from-slate-900 to-zinc-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
            <Heart className="w-8 h-8 fill-white/80" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">
            {surpriseHeadline}
          </h3>

          <p className="text-zinc-300 leading-relaxed text-base max-w-md mx-auto mb-6">
            {surpriseMessage}
          </p>

          {/* Progressive Stages if present */}
          {stages.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left my-4">
              <div className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-1">
                Surprise {currentStage + 1} of {stages.length}
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                {stages[currentStage].title}
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {stages[currentStage].description}
              </p>

              {currentStage < stages.length - 1 && (
                <button
                  onClick={handleNextStage}
                  className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Next Surprise →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
