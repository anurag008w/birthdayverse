import React from 'react';
import {
  Sparkles,
  Heart,
  Gift,
  Star,
  Compass,
  ArrowRight,
  Flame,
  Volume2,
  Shield,
  Layers,
  ChevronRight,
  Smile
} from 'lucide-react';
import { TEMPLATES_CATALOG } from '../../lib/templates/registry.js';
import { launchConfetti } from '../ui/confetti.js';

interface LandingProps {
  onCreateClick: () => void;
  onExploreClick: () => void;
  onDashboardClick?: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({
  onCreateClick,
  onExploreClick,
  onDashboardClick
}) => {
  const featuredTemplates = TEMPLATES_CATALOG.slice(0, 14);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-pink-500 selection:text-white overflow-x-hidden">
      {/* Ambient Cosmic Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-pink-600/20 via-purple-600/20 to-indigo-600/20 rounded-full blur-[140px] opacity-70" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            BirthdayVerse
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          {onDashboardClick && (
            <button
              onClick={onDashboardClick}
              className="text-zinc-300 hover:text-white transition-colors"
            >
              My Surprises
            </button>
          )}
          <button
            onClick={onCreateClick}
            className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-full transition-all duration-300 hover:scale-105 shadow-xl font-bold uppercase tracking-wider"
          >
            Create
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-mono tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" /> A digital gift made just for them
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-serif leading-[1.1] text-white">
          MAKE THEIR BIRTHDAY <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-400">
            UNFORGETTABLE
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Create a personalized interactive birthday experience and send it as one beautiful link.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onCreateClick}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-2xl shadow-pink-500/30 flex items-center justify-center gap-2.5"
          >
            <Gift className="w-4 h-4" /> CREATE THE SURPRISE
          </button>

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-7 py-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/15 font-semibold rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> EXPLORE EXPERIENCES
          </button>
        </div>
      </header>

      {/* Philosophy Banner: Not a SaaS app */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="p-8 sm:p-12 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-white">Interactive Magic</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Blowable candles, wax-sealed opening envelopes, scratch reveals, and connectable constellations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-white">Zero Photos Required</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Never worry about finding photos. Kinetic typography and procedural art make pure words feel cinematic.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-white">Durable Forever</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Persisted encrypted inside a dedicated GitHub repository. Zero third-party databases required.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Templates Showcase */}
      <section id="explore" className="relative z-10 max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            80+ Hand-Crafted Universes
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            From playful chaos to quiet midnight letters, choose an atmosphere designed for your specific bond.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTemplates.map((t) => (
            <div
              key={t.id}
              onClick={onCreateClick}
              className="group cursor-pointer rounded-3xl border border-white/10 bg-zinc-900/60 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] uppercase font-mono tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full text-zinc-300">
                    {t.category}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t.experienceMode}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-serif text-white group-hover:text-pink-300 transition-colors mb-2">
                  {t.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  {t.tagline}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors">
                <span>Select this universe</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <button
            onClick={onCreateClick}
            className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl shadow-pink-500/20"
          >
            Start Crafting With Any Template →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-12 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-serif text-zinc-400">
          BirthdayVerse — Tell us about someone you care about, and we turn those words into a little world made just for them.
        </p>
        <p className="font-mono text-[10px] text-zinc-600">
          Canonical Persistence: Dedicated GitHub Data Repository • Fail-Closed Architecture
        </p>
      </footer>
    </div>
  );
};
