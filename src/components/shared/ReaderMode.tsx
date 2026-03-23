'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import SignalLabel from '@/components/shared/SignalLabel';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';

interface ReaderModeProps {
  story: BriefStory;
  onClose: () => void;
}

export default function ReaderMode({ story, onClose }: ReaderModeProps) {
  const { lang, dir, t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const firstSourceUrl = story.sources?.[0]?.url;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        dir={dir}
        className="relative w-full max-w-2xl mx-auto rounded-2xl rounded-b-none sm:rounded-2xl bg-gray-900 border border-gray-700 max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {lang === 'he' ? '📖 מצב קריאה' : '📖 Reader Mode'}
          </span>
          <button
            onClick={onClose}
            aria-label={lang === 'he' ? 'סגור' : 'Close'}
            className="text-gray-400 hover:text-gray-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-gray-400">
            {t(story.category)}
          </span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium
                            ${story.lens === 'israel'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                              : 'bg-purple-500/15 border-purple-500/30 text-purple-300'}`}>
            {story.lens === 'israel'
              ? (lang === 'he' ? 'ישראל' : 'Israel')
              : (lang === 'he' ? 'עולם' : 'World')}
          </span>
          <SignalLabel isSignal={story.isSignal} />
        </div>

        {/* Section 2: Large headline */}
        <h2 className="text-xl font-bold leading-snug">
          {t(story.headline)}
        </h2>

        {/* Section 3: Full summary */}
        <p className="text-base text-gray-200 leading-relaxed">
          {t(story.summary)}
        </p>

        {/* Section 4: Likelihood bar + percentage + delta */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} />
          </div>
          <span className="text-sm font-semibold text-gray-200 shrink-0">
            {story.likelihood}%
          </span>
          <DeltaIndicator delta={story.delta} />
        </div>

        {/* Section 5: Why it matters */}
        <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-2">
            {lang === 'he' ? '🎯 למה זה חשוב?' : '🎯 Why does this matter?'}
          </p>
          <p className="text-sm text-gray-200 leading-relaxed">
            {t(story.why)}
          </p>
        </div>

        {/* Section 6: Sources */}
        {story.sources?.length > 0 && (
          <div>
            <div className="border-t border-gray-700/50 mb-4" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {lang === 'he' ? '📰 מקורות' : '📰 Sources'}
            </p>
            <div className="flex flex-col gap-2">
              {story.sources.map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  <span>{src.name}</span>
                  <span className="text-gray-500">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-700/50">
          {firstSourceUrl ? (
            <a
              href={firstSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              {lang === 'he' ? 'פתח באתר המקורי ↗' : 'Open original ↗'}
            </a>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            {lang === 'he' ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
