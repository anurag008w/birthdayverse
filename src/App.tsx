import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage.js';
import { CreatorStudio } from './components/creator/CreatorStudio.js';
import { CreatorDashboard } from './components/dashboard/CreatorDashboard.js';
import { UniversalExperienceRenderer } from './components/experiences/UniversalExperienceRenderer.js';
import type { PublicPresentationData } from './types/schema.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'create' | 'dashboard' | 'public'>('landing');
  const [publicExperienceId, setPublicExperienceId] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<PublicPresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);

  useEffect(() => {
    // Detect route based on window.location.pathname
    const path = window.location.pathname;

    if (path.startsWith('/b/') || path.startsWith('/birthday/')) {
      const parts = path.split('/');
      const id = parts[2];
      if (id) {
        setPublicExperienceId(id);
        setCurrentView('public');
        fetchPublicExperience(id);
        return;
      }
    }

    if (path === '/create') {
      setCurrentView('create');
    } else if (path === '/dashboard') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
    setLoading(false);
  }, []);

  const fetchPublicExperience = async (id: string) => {
    setLoading(true);
    setPublicError(null);
    try {
      const res = await fetch(`/api/b/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setPublicError('This birthday surprise could not be found or may have been removed.');
        } else {
          setPublicError('This surprise is temporarily unavailable. Please try again soon.');
        }
        setLoading(false);
        return;
      }
      const result = await res.json();
      if (result.success && result.experience) {
        setPublicData(result.experience);
      } else {
        setPublicError('This surprise is temporarily unavailable.');
      }
    } catch {
      setPublicError('This surprise is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (view: 'landing' | 'create' | 'dashboard') => {
    setCurrentView(view);
    const targetPath = view === 'landing' ? '/' : `/${view}`;
    window.history.pushState({}, '', targetPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white select-none">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
          Loading BirthdayVerse...
        </p>
      </div>
    );
  }

  // Public Experience View (Sanitized, NO editor, NO dashboard, NO form)
  if (currentView === 'public') {
    if (publicError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h2 className="text-2xl font-bold font-serif mb-2">Temporarily Unavailable</h2>
            <p className="text-sm text-zinc-400 mb-6">{publicError}</p>
            <a
              href="/"
              className="px-6 py-2.5 bg-white text-black font-semibold rounded-full text-xs uppercase tracking-wider inline-block"
            >
              Return Home
            </a>
          </div>
        </div>
      );
    }

    if (publicData) {
      return (
        <UniversalExperienceRenderer
          data={publicData}
          isPreview={false}
          appUrl={window.location.origin}
        />
      );
    }
  }

  if (currentView === 'create') {
    return (
      <CreatorStudio
        appUrl={window.location.origin}
        onPublished={(publicId) => {
          // Stay on success view or allow navigation
        }}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <CreatorDashboard
        onCreateNew={() => navigateTo('create')}
      />
    );
  }

  return (
    <LandingPage
      onCreateClick={() => navigateTo('create')}
      onExploreClick={() => {
        const el = document.getElementById('explore');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
      onDashboardClick={() => navigateTo('dashboard')}
    />
  );
};
