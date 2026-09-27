import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  Calendar,
  Send,
  Wand2,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  Eye,
  Lock,
  Layers,
  Smile,
  Music,
  HelpCircle,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TEMPLATES_CATALOG, getTemplateById, TemplateDefinition } from '../../lib/templates/registry.js';
import { recommendExperiences } from '../../lib/recommendations.js';
import { UniversalExperienceRenderer } from '../experiences/UniversalExperienceRenderer.js';
import { generateQrSvg } from '../../lib/utils/qrcode.js';
import type {
  RelationshipType,
  MoodType,
  ExperienceMode,
  PublicPresentationData,
  CanonicalExperienceRecord
} from '../../types/schema.js';

interface CreatorStudioProps {
  appUrl?: string;
  initialExperience?: CanonicalExperienceRecord;
  managementToken?: string;
  onPublished?: (publicId: string, url: string) => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  appUrl = 'https://birthdayverse.onrender.com',
  initialExperience,
  managementToken,
  onPublished
}) => {
  // Mode: 1-minute quick vs 12-step customizer
  const [creatorMode, setCreatorMode] = useState<'quick' | 'detailed'>('quick');

  // Creation State
  const [step, setStep] = useState(1);
  const [birthdayName, setBirthdayName] = useState(initialExperience?.birthdayName || '');
  const [nickname, setNickname] = useState(initialExperience?.nickname || '');
  const [creatorName, setCreatorName] = useState(initialExperience?.creatorName || '');
  const [relationship, setRelationship] = useState<RelationshipType>(initialExperience?.relationship || 'bestie');
  const [birthdayDate, setBirthdayDate] = useState(
    initialExperience?.birthdayDate || new Date().toISOString().split('T')[0]
  );
  const [timezone, setTimezone] = useState(
    initialExperience?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [age, setAge] = useState<number | undefined>(initialExperience?.age);
  const [mood, setMood] = useState<MoodType>(initialExperience?.mood || 'aesthetic');
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(initialExperience?.experienceMode || 'story');
  const [templateId, setTemplateId] = useState(initialExperience?.templateId || 'night-sky');
  
  // Message & details
  const [coreMessage, setCoreMessage] = useState(
    initialExperience?.coreMessage || 'You brighten every room you enter. So grateful for you!'
  );
  const [funnyDetails, setFunnyDetails] = useState(initialExperience?.funnyDetails || '');
  const [finalWish, setFinalWish] = useState(
    initialExperience?.finalWish || 'May this year be your happiest and most memorable chapter yet.'
  );

  // Interactions chosen
  const [hasCake, setHasCake] = useState(true);
  const [hasEnvelope, setHasEnvelope] = useState(true);
  const [hasGiftBox, setHasGiftBox] = useState(false);
  const [hasScratchCard, setHasScratchCard] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [hasConstellation, setHasConstellation] = useState(false);
  const [hasWishJar, setHasWishJar] = useState(false);

  // Persistence status
  const [saveStatus, setSaveStatus] = useState<'local' | 'saving' | 'github_saved' | 'error'>('local');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedData, setPublishedData] = useState<{ publicId: string; publicUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI helper state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Recommendations
  const recommendations = recommendExperiences({
    relationship,
    mood,
    experienceMode,
    messageLength: coreMessage.length,
    hasPhotos: false
  });

  // Debounced auto-save simulation / local tracker
  useEffect(() => {
    setSaveStatus('local');
  }, [birthdayName, creatorName, relationship, birthdayDate, coreMessage, templateId, mood]);

  // Construct current preview data
  const currentPreviewData: PublicPresentationData = {
    schemaVersion: '1.0.0',
    publicId: publishedData?.publicId || 'preview_id',
    publicSlug: `${birthdayName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'friend'}-preview`,
    status: 'draft',
    templateId,
    templateVersion: '1.0.0',
    birthdayName: birthdayName || 'Bestie',
    nickname,
    creatorName: creatorName || 'Your Friend',
    relationship,
    birthdayDate,
    timezone,
    age,
    mood,
    experienceMode,
    coreMessage,
    funnyDetails,
    finalWish,
    sceneConfiguration: getTemplateById(templateId).defaultScenes,
    interactionConfiguration: {
      hasCake,
      cake: { candlesCount: 3, blowoutMethod: 'both', blowoutCelebration: 'fireworks' },
      hasEnvelope,
      envelope: {
        sealColor: '#b91c1c',
        waxEmblem: 'heart',
        letterTitle: `To My Favorite ${relationship}`,
        letterBody: coreMessage,
        signature: creatorName
      },
      hasGiftBox,
      giftBox: {
        boxColor: '#e11d48',
        ribbonColor: '#facc15',
        surpriseHeadline: `Happy Birthday, ${birthdayName}!`,
        surpriseMessage: finalWish,
        stages: []
      },
      hasScratchCard,
      scratchCard: {
        coverColor: '#64748b',
        revealHeadline: 'Special Wish',
        revealMessage: finalWish,
        thresholdPercent: 40
      },
      hasQuiz,
      hasConstellation,
      hasWishJar
    },
    mediaReferences: [],
    audioConfiguration: {
      enabled: true,
      allowMute: true,
      autoPlayAllowed: false
    },
    releaseConfiguration: {
      releaseAt: birthdayDate,
      timezone,
      isAuthoritative: true
    },
    isPasswordProtected: false,
    seoConfiguration: {
      title: `Happy Birthday ${birthdayName}!`,
      description: `A personalized birthday universe made with love.`
    }
  };

  // AI Assistant Action
  const handleAiAssist = async (style: any) => {
    setAiLoading(true);
    setAiStatus('Refining your words with love...');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: coreMessage,
          style,
          name: birthdayName,
          relationship
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCoreMessage(data.result);
        setAiStatus('Words polished!');
      } else {
        setAiStatus(data.error || 'AI assistance unavailable. Manual editing enabled.');
      }
    } catch {
      setAiStatus('AI service temporarily unreachable. Manual editing enabled.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiStatus(null), 3500);
    }
  };

  // Publish to GitHub Data Repository
  const handlePublish = async () => {
    if (!birthdayName.trim()) {
      setErrorMessage('Please enter the birthday person’s name.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setSaveStatus('saving');

    try {
      const payload = {
        birthdayName,
        nickname,
        creatorName,
        relationship,
        birthdayDate,
        timezone,
        age,
        personality: ['Kind', 'Radiant', 'Loyal'],
        bond: 'Irreplaceable',
        tone: mood,
        mood,
        experienceMode,
        templateId,
        templateVersion: '1.0.0',
        status: 'published',
        coreMessage,
        funnyDetails,
        finalWish,
        sceneConfiguration: currentPreviewData.sceneConfiguration,
        interactionConfiguration: currentPreviewData.interactionConfiguration,
        mediaReferences: [],
        audioConfiguration: currentPreviewData.audioConfiguration,
        releaseConfiguration: currentPreviewData.releaseConfiguration,
        privacyConfiguration: {
          visibility: 'public',
          allowSearchIndexing: false
        },
        seoConfiguration: currentPreviewData.seoConfiguration
      };

      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not securely publish to GitHub data repository.');
      }

      const publicId = result.experience.publicId;
      const publicUrl = `${window.location.origin}/b/${publicId}`;

      setPublishedData({ publicId, publicUrl });
      setSaveStatus('github_saved');

      if (onPublished) {
        onPublished(publicId, publicUrl);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Couldn’t save your changes right now. Your draft is preserved locally.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!publishedData) return;
    navigator.clipboard.writeText(publishedData.publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // If Published: Show magical success screen
  if (publishedData) {
    const qrSvg = generateQrSvg(publishedData.publicUrl, 220);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
        <div className="w-full max-w-lg bg-zinc-900/90 border border-white/15 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-bold font-serif mb-2 text-white">
            YOUR SURPRISE IS READY!
          </h2>
          <p className="text-sm text-zinc-300 mb-6">
            A private universe made for <strong className="text-pink-300">{birthdayName}</strong> has been securely published.
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div
              className="p-3 bg-white rounded-2xl shadow-inner inline-block"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>

          {/* Public Link Box */}
          <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/10 mb-6">
            <input
              type="text"
              readOnly
              value={publishedData.publicUrl}
              className="bg-transparent text-xs text-zinc-200 flex-1 px-2 outline-none font-mono"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a
              href={publishedData.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Open Experience
            </a>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I made a special birthday universe for you! Open this: ${publishedData.publicUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              Send on WhatsApp
            </a>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono">
            Canonical data backed up in dedicated GitHub data repository.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-xs text-zinc-300 hover:text-white transition-all shadow-sm"
            title="Back to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">Home</span>
          </a>

          <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" /> BirthdayVerse Studio
          </span>
          <div className="hidden md:flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full text-[11px] font-mono border border-zinc-700">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'github_saved'
                  ? 'bg-emerald-400'
                  : saveStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-400'
              }`}
            />
            <span className="text-zinc-300">
              {saveStatus === 'github_saved' ? 'Saved (GitHub)' : saveStatus === 'saving' ? 'Saving...' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-800 p-0.5 rounded-lg border border-zinc-700 flex text-xs">
            <button
              onClick={() => setCreatorMode('quick')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                creatorMode === 'quick' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              1-Minute Quick
            </button>
            <button
              onClick={() => setCreatorMode('detailed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                creatorMode === 'detailed' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Full Customizer
            </button>
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-500/25 flex items-center gap-1.5"
          >
            {isPublishing ? (
              <>Saving to GitHub...</>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Publish
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Workspace: Form on Left, Live Preview on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 p-6 border-r border-zinc-800/80 overflow-y-auto max-h-[calc(100vh-73px)] space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1-Minute Quick Flow */}
          {creatorMode === 'quick' ? (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Quick 1-Minute Creation</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Tell us a few words about them, and BirthdayVerse will build their world.
                </p>
              </div>

              {/* Birthday Person Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Who is the birthday person? *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shanti, Maya, Alex"
                  value={birthdayName}
                  onChange={(e) => setBirthdayName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-pink-500 outline-none transition-colors"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Your Relationship *
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['bestie', 'sister', 'brother', 'mom', 'dad', 'partner', 'friend', 'cousin'] as RelationshipType[]).map((rel) => (
                    <button
                      key={rel}
                      onClick={() => setRelationship(rel)}
                      className={`p-2 rounded-xl border text-center capitalize transition-all ${
                        relationship === rel
                          ? 'border-pink-500 bg-pink-500/20 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              {/* One Sentence Heartfelt Message */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    One Heartfelt Thought *
                  </label>
                  <button
                    onClick={() => handleAiAssist('sweet')}
                    disabled={aiLoading}
                    className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" /> Polish with AI
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="What makes them special? (e.g. You always bring light into every day, and I am so grateful to have you in my corner.)"
                  value={coreMessage}
                  onChange={(e) => setCoreMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-pink-500 outline-none transition-colors"
                />
                {aiStatus && <p className="text-[11px] text-pink-300 mt-1 italic">{aiStatus}</p>}
              </div>

              {/* Birthday Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Birthday Date *
                </label>
                <input
                  type="date"
                  value={birthdayDate}
                  onChange={(e) => setBirthdayDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:border-pink-500 outline-none transition-colors"
                />
              </div>

              {/* Vibe / Mood */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Choose the Vibe *
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['aesthetic', 'cosmic', 'chaotic', 'cozy', 'luxury', 'retro'] as MoodType[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`p-2 rounded-xl border text-center capitalize transition-all ${
                        mood === m
                          ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Templates */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Recommended Experiences
                </label>
                <div className="space-y-2">
                  {recommendations.topTemplates.map(({ template: t, matchLabel, reason }) => (
                    <div
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        templateId === t.id
                          ? 'border-pink-500 bg-pink-500/15 shadow-md'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-serif font-bold text-sm text-white">{t.name}</span>
                        <span className="text-[10px] font-mono uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                          {matchLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{t.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big Action Button for Quick Mode */}
              <div className="pt-2">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {isPublishing ? (
                    <>Saving to GitHub...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Publish & Create Surprise Link
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* 12-Step Deep Customizer */
            <div className="space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-pink-400 font-bold">
                  Step {step} of 6: Deep Personalization
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStep(Math.min(6, step + 1))}
                    disabled={step === 6}
                    className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">01. About Them</h3>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={birthdayName}
                      onChange={(e) => setBirthdayName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">Nickname (Optional)</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">Age Turning (Optional)</label>
                    <input
                      type="number"
                      value={age || ''}
                      onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">02. Inside Jokes & Memories</h3>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">Funny Details & Quirks</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Always late by 15 minutes, drinks iced coffee in winter, obsession with cats."
                      value={funnyDetails}
                      onChange={(e) => setFunnyDetails(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">03. The Core Letter</h3>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(['improve', 'fun', 'sweet', 'emotional', 'roast', 'letter'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => handleAiAssist(style)}
                        disabled={aiLoading}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-[11px] text-pink-300 hover:bg-pink-500/20 capitalize"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={6}
                    value={coreMessage}
                    onChange={(e) => setCoreMessage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none"
                  />
                  {aiStatus && <p className="text-[11px] text-pink-300 italic">{aiStatus}</p>}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">04. Interactive Modules</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Interactive Birthday Cake & Candles', state: hasCake, setter: setHasCake },
                      { label: 'Wax-Sealed Digital Letter', state: hasEnvelope, setter: setHasEnvelope },
                      { label: '3D Unboxing Gift Box', state: hasGiftBox, setter: setHasGiftBox },
                      { label: 'Holographic Scratch Card', state: hasScratchCard, setter: setHasScratchCard },
                      { label: 'Name Starlight Constellation', state: hasConstellation, setter: setHasConstellation },
                      { label: 'Glowing Wishes Glass Jar', state: hasWishJar, setter: setHasWishJar },
                      { label: 'Friendship Trivia Quiz', state: hasQuiz, setter: setHasQuiz }
                    ].map((mod, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mod.state}
                          onChange={(e) => mod.setter(e.target.checked)}
                          className="rounded text-pink-500"
                        />
                        <span className="text-zinc-200">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">05. Template Catalog</h3>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {TEMPLATES_CATALOG.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setTemplateId(t.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          templateId === t.id
                            ? 'border-pink-500 bg-pink-500/20'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-serif font-bold text-sm text-white">{t.name}</div>
                        <div className="text-xs text-zinc-400">{t.tagline}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold">06. Closing Wish & Release</h3>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">Final Birthday Wish</label>
                    <textarea
                      rows={3}
                      value={finalWish}
                      onChange={(e) => setFinalWish(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white outline-none"
                    />
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 font-bold rounded-xl text-xs uppercase tracking-wider text-white shadow-xl hover:scale-[1.01] transition-transform"
                  >
                    CREATE MY BIRTHDAY EXPERIENCE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Live Interactive Preview Viewport */}
        <div className="lg:col-span-7 bg-zinc-950 flex flex-col justify-start items-center overflow-y-auto max-h-[calc(100vh-65px)] p-2 sm:p-4 lg:p-6 relative">
          <div className="w-full h-full flex flex-col rounded-3xl border border-zinc-800 bg-slate-950 overflow-hidden shadow-2xl relative min-h-[640px]">
            <UniversalExperienceRenderer
              data={currentPreviewData}
              isPreview={true}
              appUrl={appUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
