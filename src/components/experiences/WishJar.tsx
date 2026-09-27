import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';

interface WishJarProps {
  wishes: string[];
  recipientName: string;
}

export const WishJar: React.FC<WishJarProps> = ({ wishes, recipientName }) => {
  const [openedWishes, setOpenedWishes] = useState<number[]>([]);
  const [activeWishIndex, setActiveWishIndex] = useState<number | null>(null);

  const defaultWishes = wishes.length > 0 ? wishes : [
    'May this year bring you boundless courage and peace.',
    'May you laugh until your stomach hurts every single week.',
    'May every dream you whispered in secret find its wings.',
    'May you always know how deeply cherished you are.',
    'May this year be your grandest adventure yet.'
  ];

  const handleOpenWish = (index: number) => {
    if (!openedWishes.includes(index)) {
      setOpenedWishes([...openedWishes, index]);
      launchConfetti(undefined, undefined, 'star');
    }
    setActiveWishIndex(index);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto select-none">
      {/* The Glass Jar Container */}
      <div className="relative w-64 h-80 rounded-[40px] border-4 border-amber-300/40 bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-amber-600/20 shadow-[0_0_50px_rgba(251,191,36,0.15)] flex flex-col items-center justify-between p-4 overflow-hidden backdrop-blur-sm">
        {/* Jar Wooden Lid */}
        <div className="w-36 h-6 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-t-xl shadow-md border-b-2 border-amber-950 flex items-center justify-center -mt-2">
          <div className="w-40 h-2 bg-amber-900 rounded-full shadow-inner" />
        </div>

        {/* Floating Glowing Orbs */}
        <div className="relative w-full h-full flex flex-wrap items-center justify-around p-3 gap-2">
          {defaultWishes.map((_, i) => {
            const isOpened = openedWishes.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleOpenWish(i)}
                className={`relative w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg ${
                  isOpened
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300 scale-90'
                    : 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 animate-pulse hover:scale-110 shadow-amber-400/50'
                }`}
                title={`Open Wish #${i + 1}`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-amber-900 text-amber-200 rounded-full w-4 h-4 flex items-center justify-center border border-amber-400">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Jar Base Tag */}
        <div className="w-full text-center pb-2">
          <span className="text-[11px] font-serif tracking-wider uppercase text-amber-300/80 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
            {recipientName}’s Wishes ({openedWishes.length}/{defaultWishes.length})
          </span>
        </div>
      </div>

      {/* Revealed Active Wish Popup */}
      {activeWishIndex !== null && (
        <div className="mt-6 w-full bg-zinc-900/90 border border-amber-400/40 rounded-2xl p-5 text-center shadow-xl animate-fadeIn">
          <div className="flex justify-center text-amber-400 mb-2">
            <Heart className="w-6 h-6 fill-amber-400/30" />
          </div>
          <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">
            Wish #{activeWishIndex + 1}
          </div>
          <p className="text-zinc-100 font-serif text-base leading-relaxed">
            "{defaultWishes[activeWishIndex]}"
          </p>
        </div>
      )}

      {activeWishIndex === null && (
        <p className="text-xs text-zinc-400 mt-4 text-center">
          Tap the glowing orbs inside the jar to catch each wish!
        </p>
      )}
    </div>
  );
};
