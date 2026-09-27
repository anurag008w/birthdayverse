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
  Maximize2,
  Lock,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { getTemplateById, TemplateDefinition } from '../../lib/templates/registry.js';
import { calculateCountdown } from '../../lib/utils/dates.js';
import { generateQrSvg } from '../../lib/utils/qrcode.js';
import { launchConfetti, launchFireworks } from '../ui/confetti.js';
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

export const UniversalExperienceRenderer: React.FC<ExperienceRendererProps> = ({
  data,
  isPreview = false,
  appUrl = 'https://birthdayverse.onrender.com'
}) => {
  const template = getTemplateById(data.templateId);
  const theme = template.visualTheme;

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

  // Audio BGM Synthesizer
  useEffect(() => {
    if (isMuted) return;

    let audioCtx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioCtx();
      osc = audioCtx.createOscillator();
      gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, audioCtx.currentTime); // Relaxing warm harmonic 432Hz
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
    } catch {
      // Audio autoplay policy handled silently
    }

    return () => {
      if (osc) osc.stop();
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [isMuted]);

  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const isFinalScene = currentSceneIndex === scenes.length - 1;

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      if (currentSceneIndex + 1 === scenes.length - 1) {
        launchFireworks();
      }
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
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

  return (
    <div 
      className={`min-h-screen relative flex flex-col items-center justify-between transition-colors duration-700 select-none overflow-x-hidden ${theme.fontClass}`}
      style={{ backgroundColor: theme.bg, color: theme.textPrimary }}
    >
      {/* Dynamic Animated Particle Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30 animate-pulse"
            style={{
              width: `${(i % 4) * 2 + 2}px`,
              height: `${(i % 4) * 2 + 2}px`,
              backgroundColor: theme.accent,
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
              animationDuration: `${3 + (i % 4)}s`
            }}
          />
        ))}
      </div>

      {/* Creator Preview Toolbar (Strictly disabled on public link) */}
      {isPreview && (
        <div className="w-full bg-zinc-950/90 border-b border-zinc-800 px-4 py-2 z-50 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>CREATOR PREVIEW MODE</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Toggle */}
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

            {/* Scene Skipper */}
            <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <span>Scene {currentSceneIndex + 1}/{scenes.length}</span>
              <button onClick={handlePrevScene} disabled={currentSceneIndex === 0} className="disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleNextScene} disabled={isFinalScene} className="disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls (Sound & Share) */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 z-20 flex justify-between items-center">
        <div className="text-xs uppercase tracking-widest font-mono opacity-60">
          BirthdayVerse
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 transition-all text-white/80"
            title={isMuted ? 'Play Music' : 'Mute Music'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 transition-all text-white/80"
            title="Share Surprise"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Experience Viewport */}
      <main 
        className={`w-full max-w-4xl mx-auto px-4 py-8 z-10 flex flex-col items-center justify-center flex-1 transition-all duration-300 ${
          isPreview && previewDevice === 'mobile' ? 'max-w-[400px] border-x border-white/10 shadow-2xl min-h-[680px]' : ''
        }`}
      >
        {/* Scene 1: Opening & Kinetic Typography */}
        {currentScene.type === 'opening' && (
          <div className="text-center space-y-6 max-w-2xl animate-fadeIn">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase border border-white/20 bg-white/5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> {data.birthdayDate}
            </span>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              A Universe Created For <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-400 drop-shadow-md">
                {data.birthdayName}
              </span>
            </h1>

            <p className="text-lg sm:text-xl opacity-90 max-w-xl mx-auto leading-relaxed">
              {data.coreMessage || "Today is all about celebrating the radiant energy, kindness, and magic you bring into everyone's lives."}
            </p>

            <div className="pt-4">
              <button
                onClick={handleNextScene}
                className="px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                style={{ backgroundColor: theme.accent, color: '#000000' }}
              >
                Begin the Journey <ChevronRight className="w-4 h-4" />
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
            />

            <div className="mt-6">
              <button
                onClick={handleNextScene}
                className="px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold border border-white/20 bg-white/5 hover:bg-white/15 transition-all inline-flex items-center gap-2"
              >
                Continue Surprise <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scene 3: Sealed Envelope or Letter */}
        {currentScene.type === 'message' && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <WaxSealedEnvelope
              senderName={data.creatorName}
              recipientName={data.birthdayName}
              title={`To my dearest ${data.relationship}`}
              letterContent={data.coreMessage + (data.funnyDetails ? `\n\n${data.funnyDetails}` : '')}
              signature={data.creatorName}
            />

            <div className="mt-6">
              <button
                onClick={handleNextScene}
                className="px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold border border-white/20 bg-white/5 hover:bg-white/15 transition-all inline-flex items-center gap-2"
              >
                Next Surprise <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scene 4: Scratch Card / Gift Box / Constellation / Trivia */}
        {(currentScene.type === 'surprise' || currentScene.type === 'curiosity') && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            {data.interactionConfiguration?.hasScratchCard ? (
              <ScratchCard
                headline={`A Secret Message for ${data.birthdayName}`}
                hiddenMessage={data.finalWish || "You are loved beyond measure. Keep shining brightly!"}
              />
            ) : data.interactionConfiguration?.hasConstellation ? (
              <ConstellationCanvas
                starName={data.birthdayName}
                revealMessage={`The starlight constellation forever shines for ${data.birthdayName}`}
              />
            ) : data.interactionConfiguration?.hasQuiz ? (
              <BirthdayTrivia
                birthdayName={data.birthdayName}
                customQuestions={data.interactionConfiguration?.quiz?.questions}
              />
            ) : data.interactionConfiguration?.hasWishJar ? (
              <WishJar
                wishes={data.interactionConfiguration?.wishJar?.wishes || []}
                recipientName={data.birthdayName}
              />
            ) : (
              <GiftBoxUnboxing
                surpriseHeadline={`Happy Birthday, ${data.birthdayName}!`}
                surpriseMessage={data.finalWish || "Every single memory with you is a gift."}
              />
            )}

            <div className="mt-6">
              <button
                onClick={handleNextScene}
                className="px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold border border-white/20 bg-white/5 hover:bg-white/15 transition-all inline-flex items-center gap-2"
              >
                Finale <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scene 5: Grand Finale Celebration */}
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

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => launchFireworks()}
                className="px-8 py-3 rounded-full font-bold text-sm shadow-xl transition-transform hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: theme.accent, color: '#000000' }}
              >
                <Sparkles className="w-4 h-4" /> Celebrate Again!
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="px-6 py-3 rounded-full font-semibold text-sm border border-white/20 bg-white/5 hover:bg-white/15 transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share This Memory
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Progress Dots Navigation */}
      <footer className="w-full max-w-md mx-auto px-6 py-6 z-20 flex justify-center items-center gap-2">
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

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/15 rounded-3xl p-6 text-center shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-2">Share the Surprise</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Anyone with this link can experience this birthday universe.
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div 
                className="p-3 bg-white rounded-2xl shadow-inner"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>

            {/* Copy Link Input */}
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

            {/* Social Share Buttons */}
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
