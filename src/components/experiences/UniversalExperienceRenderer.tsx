import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Monitor,
  Lock,
  Copy,
  Check,
  Trophy,
  Heart
} from 'lucide-react';
import { getTemplateById } from '../../lib/templates/registry.js';
import { calculateCountdown } from '../../lib/utils/dates.js';
import { generateQrSvg } from '../../lib/utils/qrcode.js';
import { launchConfetti, launchFireworks } from '../ui/confetti.js';
import { ambientPlayer, playChime } from '../../lib/audio/sfx.js';
import { InteractiveCake } from './InteractiveCake.js';
import { WaxSealedEnvelope } from './WaxSealedEnvelope.js';
import { GiftBoxUnboxing } from './GiftBoxUnboxing.js';
import { ScratchCard } from './ScratchCard.js';
import { ConstellationCanvas } from './ConstellationCanvas.js';
import { WishJar } from './WishJar.js';
import { BirthdayTrivia } from '../games/BirthdayTrivia.js';
import type { PublicPresentationData } from '../../types/schema.js';

interface ExperienceRendererProps {
  data: PublicPresentationData;
  isPreview?: boolean; // Set true ONLY in creator dashboard preview
  appUrl?: string;
}

export type TemplateArchetype = 'newspaper' | 'arcade' | 'dossier' | 'scrapbook' | 'nightsky' | 'luxury' | 'romantic' | 'standard';

export function getTemplateArchetype(templateId: string, category?: string, mode?: string): TemplateArchetype {
  const id = (templateId || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const m = (mode || '').toLowerCase();

  if (id.includes('newspaper') || id.includes('gazette') || id.includes('chronicle') || cat === 'editorial') {
    return 'newspaper';
  }
  if (m === 'arcade' || id.includes('arcade') || id.includes('level-up') || id.includes('retro-friend') || cat === 'retro' || (cat === 'bestie' && (id.includes('chaos') || id.includes('trivia')))) {
    return 'arcade';
  }
  if (id.includes('dossier') || id.includes('classified') || id.includes('vault') || id.includes('mission') || id.includes('secret-note')) {
    return 'dossier';
  }
  if (id.includes('scrapbook') || id.includes('polaroid') || id.includes('open-when') || id.includes('tiny-celebration') || id.includes('capsule') || id.includes('cozy-corner')) {
    return 'scrapbook';
  }
  if (m === 'nightsky' || id.includes('star') || id.includes('night-sky') || id.includes('constellation') || cat === 'cosmic') {
    return 'nightsky';
  }
  if (id.includes('luxury') || id.includes('gold') || id.includes('jubilee') || id.includes('award') || id.includes('vip') || id.includes('milestone')) {
    return 'luxury';
  }
  if (cat === 'romantic' || id.includes('romance') || id.includes('love') || id.includes('valentine') || id.includes('heart') || id.includes('midnight-bestie')) {
    return 'romantic';
  }
  return 'standard';
}

export const UniversalExperienceRenderer: React.FC<ExperienceRendererProps> = ({
  data,
  isPreview = false,
  appUrl = 'https://birthdayverse-5y3i.onrender.com'
}) => {
  const template = getTemplateById(data.templateId);
  const theme = template.visualTheme;
  const archetype = getTemplateArchetype(data.templateId, template.category, template.experienceMode);

  // Scene navigation
  const scenes = data.sceneConfiguration && data.sceneConfiguration.length > 0 
    ? data.sceneConfiguration 
    : template.defaultScenes;

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Countdown & Release Check
  const [countdown, setCountdown] = useState(() => 
    calculateCountdown(data.birthdayDate, data.timezone)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(data.birthdayDate, data.timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [data.birthdayDate, data.timezone]);

  // Ambient BGM Controller
  useEffect(() => {
    if (isMuted) {
      ambientPlayer.stop();
    } else {
      ambientPlayer.start();
    }
    return () => {
      ambientPlayer.stop();
    };
  }, [isMuted]);

  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const isFinalScene = currentSceneIndex === scenes.length - 1;

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      playChime(659.25);
      setCurrentSceneIndex(currentSceneIndex + 1);
      if (currentSceneIndex + 1 === scenes.length - 1) {
        launchFireworks();
      }
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      playChime(440);
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const shareUrl = `${appUrl}/b/${data.publicId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const qrSvg = generateQrSvg(shareUrl, 200);

  // If experience is scheduled in the future and not in preview mode: show countdown envelope
  if (!countdown.isUnlocked && !isPreview) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ backgroundColor: theme.bg, color: theme.textPrimary }}
      >
        <div className="w-full max-w-md p-8 rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold font-serif mb-2">
            A Surprise Awaits
          </h2>
          <p className="text-sm opacity-80 mb-6">
            This birthday experience for <strong className="text-white">{data.birthdayName}</strong> will unlock on their special day!
          </p>

          {/* Countdown Clock */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { val: countdown.days, label: 'Days' },
              { val: countdown.hours, label: 'Hours' },
              { val: countdown.minutes, label: 'Mins' },
              { val: countdown.seconds, label: 'Secs' }
            ].map((item, idx) => (
              <div key={idx} className="bg-black/40 p-3 rounded-2xl border border-white/10">
                <div className="text-2xl font-bold font-mono text-indigo-300">
                  {String(item.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider opacity-60">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-indigo-200/60">
            Authoritative release timezone: {data.timezone}
          </p>
        </div>
      </div>
    );
  }

  // --- STYLING VARIANTS BY ARCHETYPE ---
  const isNewspaper = archetype === 'newspaper';
  const isArcade = archetype === 'arcade';
  const isDossier = archetype === 'dossier';
  const isScrapbook = archetype === 'scrapbook';
  const isLuxury = archetype === 'luxury';

  return (
    <div 
      className={`min-h-screen relative flex flex-col items-center justify-between transition-colors duration-700 select-none overflow-x-hidden ${
        isNewspaper ? 'newspaper-paper text-stone-900 font-serif' :
        isArcade ? 'bg-zinc-950 text-yellow-300 font-mono crt-scanlines' :
        isDossier ? 'bg-[#080d14] text-emerald-400 font-mono' :
        isScrapbook ? 'bg-[#181310] text-amber-100 font-sans' :
        isLuxury ? 'bg-black text-slate-100 font-serif' :
        `${theme.fontClass} text-white`
      }`}
      style={{
        backgroundColor: isNewspaper ? '#f7f2e7' : (isArcade || isDossier) ? undefined : theme.bg,
        color: isNewspaper ? '#1c1917' : (isArcade ? '#fde047' : (isDossier ? '#34d399' : theme.textPrimary))
      }}
    >
      {/* Background Particles & Effects (Cosmic, Confetti, Dust) */}
      {!isNewspaper && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {theme.particles === 'hearts' ? (
            [...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute text-pink-400/40 select-none animate-bounce"
                style={{
                  top: `${(i * 19) % 95}%`,
                  left: `${(i * 13) % 95}%`,
                  fontSize: `${12 + (i % 3) * 6}px`,
                  animationDuration: `${2.5 + (i % 4)}s`,
                  opacity: 0.3 + (i % 3) * 0.2
                }}
              >
                ♥
              </div>
            ))
          ) : theme.particles === 'confetti' ? (
            [...Array(32)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-sm opacity-40 animate-pulse"
                style={{
                  width: `${(i % 3) * 3 + 4}px`,
                  height: `${(i % 2) * 5 + 6}px`,
                  backgroundColor: ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#fbbf24', '#10b981'][i % 6],
                  top: `${(i * 13) % 95}%`,
                  left: `${(i * 29) % 95}%`,
                  transform: `rotate(${i * 45}deg)`,
                  animationDuration: `${1.5 + (i % 3)}s`
                }}
              />
            ))
          ) : (
            [...Array(35)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  backgroundColor: i % 5 === 0 ? (isArcade ? '#facc15' : theme.accent) : '#ffffff',
                  top: `${(i * 17) % 98}%`,
                  left: `${(i * 23) % 98}%`,
                  boxShadow: i % 4 === 0 ? `0 0 8px ${theme.accent}` : 'none',
                  opacity: 0.2 + (i % 4) * 0.25,
                  animationDuration: `${2 + (i % 4)}s`
                }}
              />
            ))
          )}
        </div>
      )}

      {/* CREATOR PREVIEW TOOLBAR (Strictly shown ONLY in editor preview) */}
      {isPreview && (
        <div className="w-full bg-zinc-950/95 border-b border-zinc-800 px-4 py-2 relative z-30 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400">LIVE PREVIEW</span>
            <span className="text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-800">
              {archetype.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <button onClick={handlePrevScene} disabled={currentSceneIndex === 0} className="disabled:opacity-30 p-0.5 hover:text-white">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1">Scene {currentSceneIndex + 1}/{scenes.length}</span>
              <button onClick={handleNextScene} disabled={isFinalScene} className="disabled:opacity-30 p-0.5 hover:text-white">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLEEK FLOATING BACK BUTTON (Top-Left, appears only when currentSceneIndex > 0) */}
      {currentSceneIndex > 0 && (
        <button
          onClick={handlePrevScene}
          className={`fixed top-4 left-4 z-40 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-xl hover:scale-105 ${
            isNewspaper
              ? 'bg-[#e8dec7] border border-stone-800 text-stone-900 font-serif hover:bg-stone-900 hover:text-[#f7f2e7]'
              : isArcade
              ? 'bg-black border-2 border-yellow-400 text-yellow-400 font-mono shadow-[2px_2px_0px_#000] hover:bg-yellow-400 hover:text-black'
              : isDossier
              ? 'bg-black/90 border border-emerald-500/50 text-emerald-400 font-mono hover:bg-emerald-500/20'
              : isScrapbook
              ? 'bg-amber-950/80 border border-amber-500/30 text-amber-200 font-sans backdrop-blur-md hover:bg-amber-900'
              : 'bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/90'
          }`}
          title="Go to previous scene"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>
            {isNewspaper ? `Page ${currentSceneIndex}` :
             isArcade ? 'ESC' :
             isDossier ? 'BRIEFING' :
             'Back'}
          </span>
        </button>
      )}

      {/* SLEEK FLOATING SOUND TOGGLE (Top-Right, clean & minimal) */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2.5 rounded-full border transition-all shadow-lg ${
            isNewspaper
              ? 'bg-[#e8dec7] border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-[#f7f2e7]'
              : isArcade
              ? 'bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black shadow-[2px_2px_0px_#000]'
              : isDossier
              ? 'bg-black/90 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80'
          }`}
          title={isMuted ? 'Play Music' : 'Mute Music'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MAIN EXPERIENCE VIEWPORT */}
      {/* ========================================================================= */}
      <main 
        className={`w-full max-w-4xl mx-auto px-4 py-12 z-10 flex flex-col items-center justify-center flex-1 transition-all duration-300 ${
          isPreview && previewDevice === 'mobile' ? 'max-w-[420px] border-x border-white/10 shadow-2xl min-h-[680px]' : ''
        }`}
      >
        {/* ===================================================================== */}
        {/* ARCHETYPE 1: VINTAGE BIRTHDAY GAZETTE / NEWSPAPER                     */}
        {/* ===================================================================== */}
        {isNewspaper && (
          <div className="w-full max-w-2xl bg-[#f7f2e7] border-4 border-stone-900 p-6 sm:p-8 shadow-2xl space-y-6 text-stone-900 font-serif">
            {/* Masthead */}
            <div className="border-b-2 border-stone-900 pb-3 text-center space-y-1">
              <div className="flex justify-between items-center text-[10px] sm:text-xs uppercase tracking-widest font-mono border-b border-stone-400 pb-1 text-stone-600">
                <span>VOL. 1 • NO. 1</span>
                <span>★ COMMEMORATIVE SPECIAL EDITION ★</span>
                <span>{data.birthdayDate}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-serif pt-1">
                The Birthday Chronicle
              </h1>
              <div className="flex justify-between items-center text-[10px] italic border-t border-stone-400 pt-1 text-stone-600">
                <span>WEATHER: 100% RADIANT SUNSHINE</span>
                <span>THE WORLD’S LEADING CELEBRATION GAZETTE</span>
                <span>PRICE: FREE WITH LOVE</span>
              </div>
            </div>

            {/* Scene 1: Front Page Article */}
            {currentScene.type === 'opening' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center py-2 border-b border-stone-300">
                  <h2 className="text-2xl sm:text-4xl font-extrabold uppercase leading-tight tracking-tight">
                    EXTRA! EXTRA! A LEGEND IS BORN!
                  </h2>
                  <p className="text-xs sm:text-sm italic text-stone-700 mt-1">
                    Citizens across galaxies erupt in joy as {data.birthdayName} celebrates another historic milestone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-stone-800 text-justify">
                  <div>
                    <span className="float-left text-3xl font-black leading-none pr-1.5 font-serif text-stone-950">
                      T
                    </span>
                    ODAY MARKS a momentous day in history. Reports confirm that <strong>{data.birthdayName}</strong> continues to bring boundless light, humor, and inspiration to everyone lucky enough to know them.
                    <p className="mt-2">
                      "{data.coreMessage || 'Your presence makes the world significantly warmer and happier.'}"
                    </p>
                  </div>
                  <div className="p-3 bg-stone-200/70 border border-stone-400 rounded-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold block mb-1 text-stone-900 border-b border-stone-300 pb-0.5">
                      SPECIAL BULLETIN
                    </span>
                    <p className="text-[11px] italic">
                      "{data.funnyDetails || 'Eyewitnesses confirm the birthday icon was spotted shining brightly today with zero signs of slowing down.'}"
                    </p>
                    <div className="mt-3 pt-2 border-t border-stone-300 text-[10px] text-stone-600">
                      Dispatched by Correspondent: <strong>{data.creatorName}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-[#f7f2e7] font-serif font-bold text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-105"
                  >
                    Turn to Page 2 (The Gala Cake) ➔
                  </button>
                </div>
              </div>
            )}

            {/* Scene 2: The Confectionery Gala (Cake) */}
            {currentScene.type === 'interaction' && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="border-b border-stone-300 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600">
                    GAZETTE FEATURE • SECTION B
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase">
                    The Presidential Birthday Cake Ceremony
                  </h3>
                </div>

                <InteractiveCake
                  birthdayName={data.birthdayName}
                  age={data.age}
                  candlesCount={data.interactionConfiguration?.cake?.candlesCount || 3}
                />

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-[#f7f2e7] font-serif font-bold text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-105"
                  >
                    Turn to Official Proclamation ➔
                  </button>
                </div>
              </div>
            )}

            {/* Scene 3: Official Birthday Decree */}
            {currentScene.type === 'reveal' && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="p-6 border-2 border-stone-900 bg-stone-100 space-y-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-600">
                    ★ OFFICIAL ROYAL PROCLAMATION ★
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase">
                    HAPPY BIRTHDAY, {data.birthdayName.toUpperCase()}!
                  </h2>
                  <p className="text-sm italic leading-relaxed text-stone-800 max-w-lg mx-auto">
                    "Be it enacted by universal acclaim that {data.birthdayName} is officially declared a treasure of humanity, authorized to receive infinite cake, love, and laughter."
                  </p>
                  <button
                    onClick={() => launchConfetti()}
                    className="px-4 py-2 border border-stone-800 bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider"
                  >
                    🎉 Shower Press Confetti
                  </button>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-[#f7f2e7] font-serif font-bold text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-105"
                  >
                    Read Correspondent’s Letter ➔
                  </button>
                </div>
              </div>
            )}

            {/* Scene 4: Letters to the Editor */}
            {currentScene.type === 'message' && (
              <div className="space-y-4 animate-fadeIn">
                <WaxSealedEnvelope
                  senderName={data.creatorName}
                  recipientName={data.birthdayName}
                  title={`To my dearest ${data.relationship}`}
                  letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
                  signature={data.creatorName}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-[#f7f2e7] font-serif font-bold text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-105"
                  >
                    Turn to Sunday Feature ➔
                  </button>
                </div>
              </div>
            )}

            {/* Scene 5: Sunday Classifieds & Puzzle Section */}
            {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="border-b border-stone-300 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600">
                    SECTION C • SUNDAY CLASSIFIEDS & PUZZLES
                  </span>
                  <h3 className="text-xl font-bold uppercase">A Special Message For You</h3>
                </div>

                {data.interactionConfiguration?.hasScratchCard ? (
                  <ScratchCard
                    headline={`A Secret Dispatch for ${data.birthdayName}`}
                    hiddenMessage={data.finalWish || "You are loved beyond measure. Keep shining brightly!"}
                  />
                ) : data.interactionConfiguration?.hasQuiz ? (
                  <BirthdayTrivia
                    birthdayName={data.birthdayName}
                    customQuestions={data.interactionConfiguration?.quiz?.questions}
                  />
                ) : (
                  <GiftBoxUnboxing
                    surpriseHeadline={`Happy Birthday, ${data.birthdayName}!`}
                    surpriseMessage={data.finalWish || "Every single memory with you is a gift."}
                  />
                )}

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-[#f7f2e7] font-serif font-bold text-xs uppercase tracking-widest shadow-md transition-transform hover:scale-105"
                  >
                    Turn to Evening Edition (Finale) ➔
                  </button>
                </div>
              </div>
            )}

            {/* Scene 6: Back Page Commemoration */}
            {currentScene.type === 'finale' && (
              <div className="space-y-6 animate-fadeIn text-center py-4">
                <h2 className="text-2xl sm:text-4xl font-black uppercase">
                  To a Brilliant Year Ahead, {data.birthdayName}!
                </h2>
                <p className="text-sm italic text-stone-800 max-w-md mx-auto leading-relaxed">
                  "{data.finalWish || 'May this trip around the sun bring you endless blessings, pure laughter, and dreams realized.'}"
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => launchFireworks()}
                    className="px-6 py-3 bg-stone-900 text-[#f7f2e7] font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-stone-800 transition-transform hover:scale-105"
                  >
                    🎆 Print Extra Fireworks Edition
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3 border-2 border-stone-900 text-stone-900 font-bold text-xs uppercase tracking-wider hover:bg-stone-200 transition-colors"
                  >
                    Share Gazette Keepsake
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ARCHETYPE 2: RETRO 8-BIT ARCADE CABINET                               */}
        {/* ===================================================================== */}
        {isArcade && (
          <div className="w-full max-w-2xl bg-zinc-950 border-4 border-yellow-400 p-6 sm:p-8 shadow-[0_0_30px_rgba(250,204,21,0.4)] text-yellow-300 font-mono space-y-6">
            {/* Top Arcade HUD */}
            <div className="flex justify-between items-center text-xs border-b-2 border-yellow-400/50 pb-2">
              <span className="text-emerald-400 animate-pulse">STAGE 0{currentSceneIndex + 1}/06</span>
              <span className="text-pink-400">HI-SCORE: 999990</span>
              <span className="text-red-400">LIVES: ♥ ♥ ♥</span>
            </div>

            {/* Scene 1: Insert Coin / Level 1 */}
            {currentScene.type === 'opening' && (
              <div className="space-y-6 animate-fadeIn text-center">
                <div className="inline-block bg-yellow-400/10 border-2 border-yellow-400 px-4 py-1 text-xs text-yellow-300 animate-pulse">
                  ★ INSERT COIN TO PLAY ★
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-wider text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
                  PLAYER 1: <br />
                  <span className="text-white drop-shadow-[0_0_20px_#ffffff]">
                    {data.birthdayName.toUpperCase()}
                  </span>
                </h1>

                {/* Character Stat Card */}
                <div className="bg-black/80 border-2 border-yellow-400/60 p-4 text-xs space-y-2 text-left max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">CHARISMA:</span>
                    <span className="text-emerald-400">██████████ 100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">HUMOR LEVEL:</span>
                    <span className="text-pink-400">MAX OVERDRIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">FRIENDSHIP BOND:</span>
                    <span className="text-cyan-400">LEGENDARY TIER</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 max-w-lg mx-auto">
                  {data.coreMessage || 'MISSION: Celebrate another legendary level-up with pure joy!'}
                </p>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#ffffff] active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    [ PRESS START ▶ ]
                  </button>
                </div>
              </div>
            )}

            {/* Scene 2: Bonus Stage (Cake) */}
            {currentScene.type === 'interaction' && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="bg-yellow-400/20 border border-yellow-400 p-2 text-xs text-yellow-300">
                  ★ BONUS STAGE: CAKE POWER-UP (+5000 XP) ★
                </div>
                <InteractiveCake
                  birthdayName={data.birthdayName}
                  age={data.age}
                  candlesCount={data.interactionConfiguration?.cake?.candlesCount || 3}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#ffffff] transition-all"
                  >
                    [ NEXT MISSION STAGE ▶ ]
                  </button>
                </div>
              </div>
            )}

            {/* Scene 3: Level Up Victory */}
            {currentScene.type === 'reveal' && (
              <div className="space-y-6 animate-fadeIn text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-400 text-black rounded-lg flex items-center justify-center font-black text-3xl shadow-[0_0_20px_#facc15]">
                  <Trophy className="w-9 h-9" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-yellow-400">
                  LEVEL UP ACHIEVED!
                </h2>
                <div className="bg-black/90 border-2 border-yellow-400/80 p-6 text-sm text-zinc-200 max-w-lg mx-auto">
                  "{data.coreMessage || 'Another year wiser, stronger, and more unforgettable.'}"
                </div>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#ffffff]"
                  >
                    [ ACCESS PLAYER 2 TRANSMISSION ▶ ]
                  </button>
                </div>
              </div>
            )}

            {/* Scene 4: Player 2 Transmission */}
            {currentScene.type === 'message' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-xs text-zinc-400 uppercase tracking-widest text-center">
                  [ INCOMING TRANSMISSION FROM PLAYER 2: {data.creatorName} ]
                </div>
                <WaxSealedEnvelope
                  senderName={data.creatorName}
                  recipientName={data.birthdayName}
                  title={`To my dearest ${data.relationship}`}
                  letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
                  signature={data.creatorName}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#ffffff]"
                  >
                    [ ENTER SECRET CHALLENGE ▶ ]
                  </button>
                </div>
              </div>
            )}

            {/* Scene 5: Arcade Challenge (Trivia / Scratch) */}
            {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="text-xs text-pink-400 uppercase tracking-widest">
                  ★ SPECIAL BOSS MINI-GAME ★
                </div>
                {data.interactionConfiguration?.hasQuiz || template.id.includes('trivia') ? (
                  <BirthdayTrivia
                    birthdayName={data.birthdayName}
                    customQuestions={data.interactionConfiguration?.quiz?.questions}
                  />
                ) : (
                  <ScratchCard
                    headline={`LUCKY POWER-UP: ${data.birthdayName}`}
                    hiddenMessage={data.finalWish || "CRITICAL HIT! You are the absolute best!"}
                  />
                )}
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#ffffff]"
                  >
                    [ PROCEED TO VICTORY SCREEN ▶ ]
                  </button>
                </div>
              </div>
            )}

            {/* Scene 6: Victory Screen / Credits */}
            {currentScene.type === 'finale' && (
              <div className="space-y-6 animate-fadeIn text-center py-4">
                <div className="text-xs text-emerald-400 animate-pulse uppercase">
                  ★★★ ALL 6 STAGES COMPLETED ★★★
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-yellow-400">
                  VICTORY! HAPPY BIRTHDAY!
                </h2>
                {/* High Score Table */}
                <div className="bg-black/90 border-2 border-yellow-400 p-4 text-xs font-mono max-w-sm mx-auto space-y-2 text-left">
                  <div className="border-b border-yellow-400/40 pb-1 text-center font-bold text-yellow-300">
                    HALL OF FAME LEADERBOARD
                  </div>
                  <div className="flex justify-between text-yellow-400">
                    <span>1ST. {data.birthdayName.toUpperCase()} (CHAMPION)</span>
                    <span>999,990 PTS</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>2ND. {data.creatorName.toUpperCase()} (SIDEKICK)</span>
                    <span>999,980 PTS</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => launchFireworks()}
                    className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase shadow-[3px_3px_0px_#ffffff]"
                  >
                    [ 🎆 FIREWORKS CELEBRATION ]
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/20 font-bold text-xs uppercase"
                  >
                    [ SHARE TROPHY ]
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ARCHETYPE 3: TOP-SECRET CLASSIFIED INTELLIGENCE DOSSIER               */}
        {/* ===================================================================== */}
        {isDossier && (
          <div className="w-full max-w-2xl bg-[#0d141f] border-2 border-emerald-500/50 p-6 sm:p-8 shadow-2xl text-emerald-400 font-mono space-y-6">
            <div className="flex justify-between items-center text-xs border-b border-emerald-500/30 pb-2">
              <span className="text-red-500 font-bold tracking-widest">● TOP SECRET // DECLASSIFIED</span>
              <span className="text-zinc-400">CODE: BD-{data.birthdayName.slice(0, 4).toUpperCase()}</span>
            </div>

            {currentScene.type === 'opening' && (
              <div className="space-y-6 animate-fadeIn text-center">
                <div className="p-6 bg-[#bfa16a] text-stone-950 rounded border-2 border-stone-800 shadow-2xl text-left space-y-3">
                  <div className="border-b-2 border-stone-900 pb-2 flex justify-between items-center">
                    <span className="font-bold text-sm tracking-wider font-mono">INTELLIGENCE DOSSIER</span>
                    <span className="border-2 border-red-700 text-red-700 text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
                      EYES ONLY
                    </span>
                  </div>
                  <div className="text-xs space-y-1 font-mono">
                    <p><strong>SUBJECT:</strong> {data.birthdayName.toUpperCase()}</p>
                    <p><strong>DATE OF OCCURRENCE:</strong> {data.birthdayDate}</p>
                    <p><strong>SECURITY CLEARANCE:</strong> LEVEL 5 (UNRESTRICTED CELEBRATION)</p>
                  </div>
                  <div className="pt-2 text-xs italic leading-relaxed border-t border-stone-800/40">
                    "{data.coreMessage || 'Field reports confirm the subject is an unstoppable force of greatness.'}"
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
                  >
                    [ DECLASSIFY STAGE 2 ▶ ]
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'interaction' && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="text-xs text-emerald-400/80 uppercase tracking-widest">
                  TACTICAL THERMAL INITIATION PROTOCOL
                </div>
                <InteractiveCake
                  birthdayName={data.birthdayName}
                  age={data.age}
                  candlesCount={data.interactionConfiguration?.cake?.candlesCount || 3}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest"
                  >
                    [ ACCESS SUBJECT REVEAL ▶ ]
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'reveal' && (
              <div className="space-y-6 animate-fadeIn text-center">
                <h2 className="text-3xl sm:text-5xl font-bold text-white">
                  HAPPY BIRTHDAY, {data.birthdayName.toUpperCase()}!
                </h2>
                <div className="bg-black/80 border border-emerald-500/40 p-6 text-sm text-zinc-200 max-w-lg mx-auto leading-relaxed">
                  "{data.coreMessage || 'Operation Happy Birthday is fully executed with 100% mission success.'}"
                </div>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest"
                  >
                    [ INTERCEPTED WIRE TRANSMISSION ▶ ]
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'message' && (
              <div className="space-y-4 animate-fadeIn">
                <WaxSealedEnvelope
                  senderName={data.creatorName}
                  recipientName={data.birthdayName}
                  title={`To my dearest ${data.relationship}`}
                  letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
                  signature={data.creatorName}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest"
                  >
                    [ ADVANCE TO CIPHER DECRYPTION ▶ ]
                  </button>
                </div>
              </div>
            )}

            {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="text-xs text-emerald-400 uppercase tracking-widest">
                  DECRYPTION CIPHER MODULE
                </div>
                <ScratchCard
                  headline={`CLASSIFIED CIPHER: ${data.birthdayName}`}
                  hiddenMessage={data.finalWish || "MISSION ACCOMPLISHED: You are officially the greatest!"}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest"
                  >
                    [ FINAL DEBRIEFING ▶ ]
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'finale' && (
              <div className="space-y-6 animate-fadeIn text-center py-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-white">
                  MISSION ACCOMPLISHED ★ CELEBRATE TODAY
                </h2>
                <p className="text-sm text-zinc-300 max-w-md mx-auto">
                  "{data.finalWish || 'May this new operational year bring you unstoppable success and boundless laughter.'}"
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => launchFireworks()}
                    className="px-6 py-3 bg-emerald-500 text-black font-bold text-xs uppercase"
                  >
                    🎆 Launch Celebration Flares
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3 border border-emerald-500 text-emerald-400 font-bold text-xs uppercase"
                  >
                    Share Dossier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ARCHETYPE 4: POLAROID SCRAPBOOK MEMOIR                                */}
        {/* ===================================================================== */}
        {isScrapbook && (
          <div className="w-full max-w-2xl bg-[#241d18] border border-amber-900/40 p-6 sm:p-8 rounded-3xl shadow-2xl text-amber-100 space-y-6">
            <div className="text-center border-b border-amber-800/40 pb-3">
              <span className="text-[11px] font-mono tracking-widest text-amber-400/80 uppercase">
                ✦ POLAROID SCRAPBOOK MEMOIR ✦
              </span>
            </div>

            {currentScene.type === 'opening' && (
              <div className="space-y-6 animate-fadeIn text-center">
                {/* Tilted Polaroid Card */}
                <div className="w-72 sm:w-80 mx-auto bg-white text-stone-900 p-4 pb-6 rounded shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform relative">
                  <div className="w-16 h-4 washi-tape absolute -top-2 left-1/2 -translate-x-1/2" />
                  <div className="w-full h-52 bg-gradient-to-tr from-amber-200 via-rose-200 to-indigo-200 rounded flex flex-col items-center justify-center p-4 text-center">
                    <Heart className="w-10 h-10 text-rose-500 mb-2 animate-pulse" />
                    <span className="font-serif font-black text-2xl text-stone-900">
                      {data.birthdayName}
                    </span>
                    <span className="text-[11px] text-stone-600 font-mono mt-1">
                      {data.birthdayDate}
                    </span>
                  </div>
                  <div className="pt-3 font-serif italic text-sm text-stone-700">
                    "A story woven with infinite love..."
                  </div>
                </div>

                <p className="text-base text-amber-200/90 max-w-md mx-auto leading-relaxed">
                  {data.coreMessage || 'Every chapter of life is sweeter because you are in it.'}
                </p>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-xl transition-all"
                  >
                    Open the Scrapbook ➔
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'interaction' && (
              <div className="space-y-4 animate-fadeIn text-center">
                <InteractiveCake
                  birthdayName={data.birthdayName}
                  age={data.age}
                  candlesCount={data.interactionConfiguration?.cake?.candlesCount || 3}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full"
                  >
                    Turn to Celebration Proclamation ➔
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'reveal' && (
              <div className="space-y-6 animate-fadeIn text-center">
                <h2 className="text-3xl sm:text-5xl font-serif font-bold text-amber-200">
                  Happy Birthday, {data.birthdayName}!
                </h2>
                <div className="p-6 bg-white/5 border border-amber-500/20 rounded-2xl max-w-lg mx-auto text-sm leading-relaxed">
                  "{data.coreMessage}"
                </div>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full"
                  >
                    Read Handwritten Note ➔
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'message' && (
              <div className="space-y-4 animate-fadeIn">
                <WaxSealedEnvelope
                  senderName={data.creatorName}
                  recipientName={data.birthdayName}
                  title={`To my dearest ${data.relationship}`}
                  letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
                  signature={data.creatorName}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full"
                  >
                    Open Keepsake Jar ➔
                  </button>
                </div>
              </div>
            )}

            {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
              <div className="space-y-4 animate-fadeIn text-center">
                <WishJar
                  wishes={data.interactionConfiguration?.wishJar?.wishes || [
                    `May your days be filled with calm, laughter, and sunshine, ${data.birthdayName}!`,
                    `Forever thankful for the memories we share.`,
                    `Wishing you the happiest and most magical year ahead.`
                  ]}
                  recipientName={data.birthdayName}
                />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full"
                  >
                    View Scrapbook Closing ➔
                  </button>
                </div>
              </div>
            )}

            {currentScene.type === 'finale' && (
              <div className="space-y-6 animate-fadeIn text-center py-4">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-200">
                  Here’s to the Next Chapter of Our Story ✨
                </h2>
                <p className="text-sm text-amber-200/80 max-w-md mx-auto">
                  "{data.finalWish || 'May you continue to flourish and light up every life around you.'}"
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => launchFireworks()}
                    className="px-6 py-3 bg-amber-500 text-stone-950 font-bold text-xs uppercase rounded-full shadow-lg"
                  >
                    Celebrate Again!
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3 border border-amber-500/40 text-amber-200 font-semibold text-xs uppercase rounded-full"
                  >
                    Share Scrapbook
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ARCHETYPES 5 & 6: NIGHT SKY / LUXURY / STANDARD GALA                  */}
        {/* ===================================================================== */}
        {!isNewspaper && !isArcade && !isDossier && !isScrapbook && (
          <div className="w-full flex flex-col items-center">
            {/* Scene 1: Opening & Kinetic Typography */}
            {currentScene.type === 'opening' && (
              <div className="text-center space-y-6 max-w-2xl animate-fadeIn">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase border border-white/20 bg-white/5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {archetype === 'nightsky' ? '✦ DEEP SPACE OBSERVATORY ✦' :
                   isLuxury ? '👑 ROYAL COMMEMORATION' :
                   archetype === 'romantic' ? '♥ EXCLUSIVE MEMOIR ♥' :
                   `★ A SPECIAL CELEBRATION • ${data.birthdayDate} ★`}
                </span>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
                  {archetype === 'nightsky' ? 'Written in the Stars For' :
                   isLuxury ? 'A Royal Toast To' :
                   'A Universe Created For'} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-400 drop-shadow-md">
                    {data.birthdayName}
                  </span>
                </h1>

                <p className="text-lg sm:text-xl opacity-90 max-w-xl mx-auto leading-relaxed">
                  {data.coreMessage || "Today is all about celebrating the radiant energy, kindness, and magic you bring into everyone's lives."}
                </p>

                <div className="pt-6 flex items-center justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    {archetype === 'nightsky' ? 'Enter the Galaxy ✦' : 'Begin the Journey'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scene 2: Interactive Cake & Wish */}
            {currentScene.type === 'interaction' && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <InteractiveCake
                  birthdayName={data.birthdayName}
                  age={data.age}
                  candlesCount={data.interactionConfiguration?.cake?.candlesCount || 3}
                  flavor={(data.interactionConfiguration?.cake?.flavor as any) || 'chocolate'}
                  showFlavorPicker={false}
                />
                <div className="mt-8 flex items-center justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-2xl transition-all inline-flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    Continue Surprise <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scene 3: Grand Birthday Reveal */}
            {currentScene.type === 'reveal' && (
              <div className="w-full max-w-2xl text-center space-y-6 animate-fadeIn p-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-300 text-xs font-mono tracking-widest uppercase shadow-lg shadow-pink-500/10">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" /> THE BIG MOMENT
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold font-serif tracking-tight leading-tight">
                  Happy Birthday, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-indigo-300 drop-shadow-xl">
                    {data.birthdayName}! ✨
                  </span>
                </h1>

                <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md shadow-2xl space-y-4 max-w-xl mx-auto">
                  <p className="text-base sm:text-lg text-zinc-200 leading-relaxed font-serif">
                    "{data.coreMessage || "May your special day be overflowing with the joy, magic, and boundless blessings you deserve."}"
                  </p>
                  {data.funnyDetails && (
                    <p className="text-sm text-amber-300/90 font-medium italic border-t border-white/10 pt-3">
                      "{data.funnyDetails}"
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={() => launchConfetti()}
                      className="px-5 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all inline-flex items-center gap-2 border border-white/20"
                    >
                      🎉 Shower With Confetti
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    Open the Letter <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scene 4: Sealed Envelope */}
            {currentScene.type === 'message' && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <WaxSealedEnvelope
                  senderName={data.creatorName}
                  recipientName={data.birthdayName}
                  title={`To my dearest ${data.relationship}`}
                  letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
                  signature={data.creatorName}
                  archetype={archetype}
                />
                <div className="mt-8 flex items-center justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-2xl transition-all inline-flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    Next Discovery <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scene 5: Interactive Module (Constellation / Trivia / Scratch / Wish Jar / Gift Box) */}
            {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                {(data.interactionConfiguration?.hasConstellation || archetype === 'nightsky') ? (
                  <ConstellationCanvas
                    starName={data.birthdayName}
                    revealMessage={`The starlight constellation forever shines for ${data.birthdayName}`}
                  />
                ) : (data.interactionConfiguration?.hasQuiz || archetype === 'arcade') ? (
                  <BirthdayTrivia
                    birthdayName={data.birthdayName}
                    customQuestions={data.interactionConfiguration?.quiz?.questions}
                  />
                ) : (data.interactionConfiguration?.hasScratchCard || archetype === 'romantic') ? (
                  <ScratchCard
                    headline={`A Secret Message for ${data.birthdayName}`}
                    hiddenMessage={data.finalWish || "You are loved beyond measure. Keep shining brightly!"}
                  />
                ) : (data.interactionConfiguration?.hasWishJar || archetype === 'scrapbook') ? (
                  <WishJar
                    wishes={data.interactionConfiguration?.wishJar?.wishes || [
                      `May your year ahead be pure magic, ${data.birthdayName}!`,
                      `Wishing you endless laughter, warmth, and bright days.`,
                      `May all your silent wishes find their way to reality.`
                    ]}
                    recipientName={data.birthdayName}
                  />
                ) : (
                  <GiftBoxUnboxing
                    surpriseHeadline={`Happy Birthday, ${data.birthdayName}!`}
                    surpriseMessage={data.finalWish || "Every single memory with you is a gift."}
                  />
                )}

                <div className="mt-8 flex items-center justify-center">
                  <button
                    onClick={handleNextScene}
                    className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-2xl transition-all inline-flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    Final Celebration <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Scene 6: Grand Finale Celebration */}
            {currentScene.type === 'finale' && (
              <div className="text-center space-y-6 max-w-2xl animate-fadeIn p-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse">
                  <Sparkles className="w-10 h-10" />
                </div>

                <h2 className="text-3xl sm:text-5xl font-bold font-serif leading-tight">
                  To a Year Full of Wonder, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">
                    {data.birthdayName}
                  </span>
                </h2>

                <p className="text-base sm:text-lg opacity-90 max-w-lg mx-auto leading-relaxed">
                  "{data.finalWish || 'May this trip around the sun bring you endless blessings, pure laughter, and dreams realized.'}"
                </p>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => launchFireworks()}
                    className="px-8 py-3.5 rounded-full font-bold text-sm shadow-xl transition-transform hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: theme.accent, color: '#000000' }}
                  >
                    <Sparkles className="w-4 h-4" /> Celebrate Again!
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3.5 rounded-full font-semibold text-sm border border-white/20 bg-white/5 hover:bg-white/15 transition-all flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Share This Memory
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Progress Dots Navigation (Strictly shown ONLY in preview mode) */}
      {isPreview && (
        <footer className="w-full max-w-md mx-auto px-6 py-4 z-20 flex justify-center items-center gap-2">
          {scenes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSceneIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSceneIndex ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`Go to scene ${idx + 1}`}
            />
          ))}
        </footer>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/15 rounded-3xl p-6 text-center shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-2">Share the Surprise</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Anyone with this link can experience this birthday universe.
            </p>

            <div className="flex justify-center mb-6">
              <div 
                className="p-3 bg-white rounded-2xl shadow-inner"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>

            <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-xl border border-zinc-700 mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-zinc-300 flex-1 px-2 outline-none font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-center gap-3 mb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`A special birthday surprise for you: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Special birthday surprise for you!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                Telegram
              </a>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
