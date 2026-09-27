import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Share2,
  Calendar,
  ExternalLink,
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';
import type { OwnerExperienceSummary } from '../../types/schema.js';

interface DashboardProps {
  ownerId?: string;
  onSelectExperience?: (publicId: string, action: 'edit' | 'preview') => void;
  onCreateNew?: () => void;
}

export const CreatorDashboard: React.FC<DashboardProps> = ({
  ownerId,
  onSelectExperience,
  onCreateNew
}) => {
  const [experiences, setExperiences] = useState<OwnerExperienceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/experiences');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.experiences || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [ownerId]);

  const handleCopyLink = (publicId: string) => {
    const url = `${window.location.origin}/b/${publicId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(publicId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDuplicate = async (publicId: string) => {
    try {
      const res = await fetch(`/api/experiences/${publicId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchExperiences();
      } else {
        setActionError(data.error || 'Failed to duplicate experience.');
      }
    } catch {
      setActionError('Network error duplicating experience.');
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this experience? It will be marked as deleted and disabled.')) {
      return;
    }
    try {
      const res = await fetch(`/api/experiences/${publicId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setExperiences(prev => prev.filter(e => e.publicId !== publicId));
      } else {
        setActionError(data.error || 'Failed to delete experience.');
      }
    } catch {
      setActionError('Network error deleting experience.');
    }
  };

  const filtered = experiences.filter(e =>
    e.birthdayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.templateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-pink-500" /> My Birthday Experiences
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Durable birthday surprises backed safely in your dedicated GitHub repository.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Surprise
          </button>
        </div>

        {actionError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by birthday name or template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        {/* List of Experiences */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-zinc-500 animate-pulse">
            Loading experiences from GitHub data repository...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 mx-auto bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-zinc-300">No Experiences Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create your first birthday surprise. It will be encrypted and saved durably to GitHub.
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create One Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((exp) => (
              <div
                key={exp.publicId}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-6 shadow-xl transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                        exp.status === 'published'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {exp.status}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-white mb-1">
                    {exp.birthdayName}
                  </h3>
                  <div className="text-xs text-pink-400 capitalize mb-4 font-mono">
                    Template: {exp.templateId.replace(/-/g, ' ')}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectExperience && onSelectExperience(exp.publicId, 'edit')}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Edit Experience"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <a
                      href={`/b/${exp.publicId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="View Public Experience"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleCopyLink(exp.publicId)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === exp.publicId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(exp.publicId)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Duplicate Experience"
                    >
                      <Copy className="w-4 h-4 text-indigo-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(exp.publicId)}
                    className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
