import React, { useState } from 'react';
import { Mail, Heart, Sparkles, Terminal } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';
import { playSealCrackSound } from '../../lib/audio/sfx.js';

interface EnvelopeProps {
  senderName: string;
  recipientName: string;
  title?: string;
  letterContent: string;
  signature?: string;
  archetype?: string;
}

export const WaxSealedEnvelope: React.FC<EnvelopeProps> = ({
  senderName,
  recipientName,
  title,
  letterContent,
  signature,
  archetype = 'standard'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      playSealCrackSound();
      launchConfetti(undefined, undefined, 'heart');
    }
  };

  const isArcade = archetype === 'arcade';
  const isNewspaper = archetype === 'newspaper';
  const isDossier = archetype === 'dossier';
  const isScrapbook = archetype === 'scrapbook';
  const isLuxury = archetype === 'luxury';
  const isNightsky = archetype === 'nightsky';

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-4">
      {!isOpen ? (
        <div 
          onClick={handleOpen}
          className={`group relative cursor-pointer p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
            isArcade
              ? 'bg-black border-4 border-yellow-400 text-yellow-300 font-mono shadow-[0_0_25px_rgba(250,204,21,0.5)]'
              : isNewspaper
              ? 'bg-[#f4eedb] border-4 border-stone-800 text-stone-900 font-serif'
              : isDossier
              ? 'bg-[#bfa16a] border-2 border-stone-900 text-stone-950 font-mono'
              : isScrapbook
              ? 'bg-[#fbf4e6] border-2 border-amber-300 text-stone-900 font-sans'
              : isLuxury
              ? 'bg-zinc-950 border-2 border-amber-400/60 text-amber-200 font-serif shadow-[0_0_30px_rgba(251,191,36,0.2)]'
              : 'bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border-2 border-indigo-400/40 text-white backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]'
          }`}
        >
          {/* Postmark / Stamp */}
          <div className="absolute top-4 right-5 text-right opacity-70">
            <div className={`border rounded-full w-14 h-14 flex flex-col items-center justify-center p-1 text-[9px] uppercase tracking-wider rotate-12 ${
              isArcade ? 'border-yellow-400 text-yellow-400' :
              isNewspaper || isDossier || isScrapbook ? 'border-stone-800 text-stone-800' :
              isLuxury ? 'border-amber-400 text-amber-300' :
              'border-indigo-300 text-indigo-200'
            }`}>
              <span>{isArcade ? 'PLAYER 2' : isDossier ? 'CLASSIFIED' : 'SPECIAL'}</span>
              <span>{isArcade ? 'LOG' : isDossier ? 'DISPATCH' : 'DELIVERY'}</span>
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest mb-6 flex items-center gap-1.5 opacity-80">
            {isArcade ? <Terminal className="w-4 h-4 text-emerald-400" /> : <Mail className="w-4 h-4 text-rose-500" />}
            {isArcade ? 'UNOPENED TRANSMISSION' : isDossier ? 'CLASSIFIED MEMORANDUM' : 'Confidential Letter for You'}
          </div>

          <div className="my-8 text-center">
            <h3 className="text-2xl font-bold tracking-wide">
              To: {recipientName}
            </h3>
            <p className="text-xs mt-1 italic opacity-80">
              From {senderName}
            </p>
          </div>

          {/* Wax Seal Button */}
          <div className="flex justify-center -mb-14 relative z-20">
            <button
              onClick={handleOpen}
              className={`w-16 h-16 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center transition-transform group-hover:scale-110 active:scale-95 group-hover:rotate-6 ${
                isArcade
                  ? 'bg-yellow-400 border-white text-black font-mono font-black shadow-[0_0_20px_#facc15]'
                  : isLuxury
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-white text-black font-serif'
                  : 'bg-gradient-to-br from-red-700 via-rose-800 to-red-900 border-amber-400 text-amber-200'
              }`}
              title="Click to open the letter"
            >
              <Heart className="w-7 h-7 fill-current" />
              <span className="text-[8px] font-bold tracking-tighter uppercase mt-0.5">OPEN</span>
            </button>
          </div>
        </div>
      ) : (
        /* OPENED LETTER CARD */
        <div className={`relative p-8 sm:p-12 rounded-3xl shadow-2xl transition-all animate-fadeIn ${
          isArcade
            ? 'bg-black/95 border-2 border-yellow-400 text-yellow-300 font-mono shadow-[0_0_30px_rgba(250,204,21,0.4)]'
            : isNewspaper
            ? 'bg-[#f7f2e7] border-2 border-stone-800 text-stone-900 font-serif'
            : isDossier
            ? 'bg-[#0b111a] border-2 border-emerald-500/60 text-emerald-300 font-mono'
            : isScrapbook
            ? 'bg-[#fdf9ee] border border-amber-300/80 text-stone-900 font-serif'
            : isLuxury
            ? 'bg-zinc-950 border border-amber-400/40 text-amber-100 font-serif shadow-[0_0_30px_rgba(251,191,36,0.15)]'
            : 'bg-slate-900/85 border border-indigo-400/30 text-white font-serif backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.25)]'
        }`}>
          {/* Decorative Corner Flairs */}
          <div className="absolute top-4 left-6 text-xs opacity-60">✦ ✦ ✦</div>
          <div className="absolute top-4 right-6 text-xs opacity-60">✦ ✦ ✦</div>

          {title && (
            <h2 className="text-center text-2xl sm:text-3xl font-bold mb-6 border-b pb-4 opacity-95">
              {title}
            </h2>
          )}

          <div className="leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-4 opacity-90">
            {letterContent}
          </div>

          <div className="mt-8 pt-6 border-t border-current/20 flex justify-between items-end">
            <div className="text-xs italic opacity-60">
              {isArcade ? 'Transmitted with love' : isDossier ? 'Authenticated Dispatch' : 'Written with devotion'}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest opacity-60">Always,</div>
              <div className="text-lg font-bold">{signature || senderName}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
