import React, { useState } from 'react';
import { Mail, Heart, CheckCircle2 } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';
import { playSealCrackSound } from '../../lib/audio/sfx.js';

interface EnvelopeProps {
  senderName: string;
  recipientName: string;
  title?: string;
  letterContent: string;
  signature?: string;
}

export const WaxSealedEnvelope: React.FC<EnvelopeProps> = ({
  senderName,
  recipientName,
  title,
  letterContent,
  signature
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      playSealCrackSound();
      launchConfetti(undefined, undefined, 'heart');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-4">
      {!isOpen ? (
        <div 
          onClick={handleOpen}
          className="group relative cursor-pointer bg-gradient-to-br from-amber-100 to-amber-200 p-8 rounded-2xl shadow-2xl border-4 border-amber-300/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/20 text-stone-800"
        >
          {/* Postmark stamp */}
          <div className="absolute top-4 right-5 text-right opacity-70">
            <div className="border border-stone-600 rounded-full w-14 h-14 flex flex-col items-center justify-center p-1 text-[9px] uppercase tracking-wider rotate-12">
              <span>SPECIAL</span>
              <span>DELIVERY</span>
            </div>
          </div>

          <div className="text-xs uppercase font-serif tracking-widest text-stone-600 mb-6 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-rose-700" />
            Confidential Letter for You
          </div>

          <div className="my-8 text-center">
            <h3 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">
              To: {recipientName}
            </h3>
            <p className="text-xs text-stone-600 mt-1 italic">
              From the heart of {senderName}
            </p>
          </div>

          {/* Red Wax Seal Button */}
          <div className="flex justify-center -mb-14 relative z-20">
            <button
              onClick={handleOpen}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 via-rose-800 to-red-900 border-2 border-amber-400 shadow-xl flex flex-col items-center justify-center text-amber-200 transition-transform group-hover:scale-110 active:scale-95 group-hover:rotate-6"
              title="Click to break the seal"
            >
              <Heart className="w-7 h-7 fill-amber-300/40 text-amber-200" />
              <span className="text-[8px] font-bold tracking-tighter uppercase mt-0.5">OPEN</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative bg-[#fffdfa] border border-amber-200 p-8 sm:p-12 rounded-2xl shadow-2xl text-stone-900 transition-all animate-fadeIn">
          {/* Decorative Corner Flairs */}
          <div className="absolute top-3 left-4 text-xs text-amber-800/40 font-serif">✦ ✦ ✦</div>
          <div className="absolute top-3 right-4 text-xs text-amber-800/40 font-serif">✦ ✦ ✦</div>

          {title && (
            <h2 className="text-center font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-6 border-b border-amber-200/70 pb-4">
              {title}
            </h2>
          )}

          <div className="font-serif text-stone-800 leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-4">
            {letterContent}
          </div>

          <div className="mt-8 pt-6 border-t border-amber-200/60 flex justify-between items-end">
            <div className="text-xs text-stone-500 italic">
              Written with devotion
            </div>
            <div className="text-right font-serif">
              <div className="text-xs text-stone-600 uppercase tracking-widest">Always,</div>
              <div className="text-lg font-bold text-stone-900">{signature || senderName}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
