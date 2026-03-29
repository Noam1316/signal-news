'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/i18n/context';

function SignalScoreBar({ score }: { score: number }) {
  const color =
    score > 60
      ? '#4ade80'
      : score > 30
      ? '#fbbf24'
      : '#6b7280';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Signal Score</span>
        <span style={{ color }} className="font-bold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, score)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'negative' | 'neutral' }) {
  const config = {
    positive: { label: 'חיובי', labelEn: 'Positive', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)' },
    negative: { label: 'שלילי', labelEn: 'Negative', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
    neutral:  { label: 'ניטרלי', labelEn: 'Neutral',  color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' },
  }[sentiment];

  return (
    <span
      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
      style={{ color: config.color, backgroundColor: config.bg, borderColor: config.border }}
    >
      {config.label} · {config.labelEn}
    </span>
  );
}

const TOPICS_LIMIT = 5;
const IMPACTS_LIMIT = 4;

export default function ArticleSidebar() {
  const { isOpen, article, close } = useSidebar();
  const { lang } = useLanguage();
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showAllImpacts, setShowAllImpacts] = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset collapse state when a new article opens
  useEffect(() => {
    if (isOpen) {
      setShowAllTopics(false);
      setShowAllImpacts(false);
    }
  }, [isOpen, article?.url]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile bottom sheet styles */}
      <style>{`
        @media (max-width: 640px) {
          .article-sidebar-panel {
            top: auto !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 80vh !important;
            border-left: none !important;
            border-top: 1px solid #1e293b !important;
            border-radius: 16px 16px 0 0 !important;
            transform: translateY(${isOpen ? '0' : '100%'}) !important;
          }
        }
      `}</style>

      {/* Sidebar panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'he' ? 'פרטי כתבה' : 'Article details'}
        className="article-sidebar-panel fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 'min(420px, 100vw)',
          backgroundColor: '#0f172a',
          borderLeft: '1px solid #1e293b',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: '1px solid #1e293b' }}
          >
            <div className="flex items-center gap-2">
              {article?.sourceName && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                >
                  {article.sourceName}
                </span>
              )}
              {article?.category && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  {article.category}
                </span>
              )}
            </div>
            <button
              onClick={close}
              aria-label={lang === 'he' ? 'סגור' : 'Close'}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors text-lg"
            >
              ×
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {article ? (
              <>
                {/* Date */}
                {article.pubDate && (
                  <p className="text-xs text-gray-500">{formatDate(article.pubDate)}</p>
                )}

                {/* Headline */}
                <h2 className="text-xl font-bold leading-snug text-white">
                  {article.title}
                </h2>

                {/* Description */}
                {article.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {article.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px solid #1e293b' }} />

                {/* Sentiment + Signal badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SentimentBadge sentiment={article.sentiment} />
                  {article.isSignal && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{ color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', borderColor: 'rgba(250,204,21,0.3)' }}
                    >
                      ⚡ Signal
                    </span>
                  )}
                </div>

                {/* Signal Score */}
                <SignalScoreBar score={article.signalScore} />

                {/* All Sources */}
                {article.allSources && article.allSources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">
                      {lang === 'he' ? 'מקורות' : 'Sources'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {article.allSources.map((src) => (
                        <a
                          key={src.name}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2.5 py-0.5 rounded-full transition-colors"
                          style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#e2e8f0'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}
                        >
                          {src.name} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                {article.topics && article.topics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">
                      {lang === 'he' ? 'נושאים' : 'Topics'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(showAllTopics ? article.topics : article.topics.slice(0, TOPICS_LIMIT)).map((topic) => (
                        <span
                          key={topic}
                          className="text-[11px] px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    {article.topics.length > TOPICS_LIMIT && (
                      <button
                        onClick={() => setShowAllTopics(v => !v)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                      >
                        {showAllTopics
                          ? (lang === 'he' ? '▴ פחות' : '▴ less')
                          : `▾ ${lang === 'he' ? `עוד ${article.topics.length - TOPICS_LIMIT}` : `+${article.topics.length - TOPICS_LIMIT} more`}`}
                      </button>
                    )}
                  </div>
                )}

                {/* Impacts */}
                {article.impacts && article.impacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">
                      {lang === 'he' ? 'השפעות צפויות' : 'Expected Impacts'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(showAllImpacts ? article.impacts : article.impacts.slice(0, IMPACTS_LIMIT)).map((impact, i) => {
                        const isPositive = impact.direction === 'positive';
                        const isNegative = impact.direction === 'negative';
                        const color = isPositive ? '#4ade80' : isNegative ? '#f87171' : '#9ca3af';
                        const bg = isPositive ? '#052e16' : isNegative ? '#2d0909' : 'rgba(156,163,175,0.1)';
                        const border = isPositive ? 'rgba(74,222,128,0.3)' : isNegative ? 'rgba(248,113,113,0.3)' : 'rgba(156,163,175,0.2)';
                        const arrow = isPositive ? '↑' : isNegative ? '↓' : '~';
                        return (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-0.5 rounded-full border font-medium"
                            style={{ color, backgroundColor: bg, borderColor: border }}
                          >
                            {arrow} {lang === 'he' ? impact.sector.he : impact.sector.en}
                          </span>
                        );
                      })}
                    </div>
                    {article.impacts.length > IMPACTS_LIMIT && (
                      <button
                        onClick={() => setShowAllImpacts(v => !v)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                      >
                        {showAllImpacts
                          ? (lang === 'he' ? '▴ פחות' : '▴ less')
                          : `▾ ${lang === 'he' ? `עוד ${article.impacts.length - IMPACTS_LIMIT}` : `+${article.impacts.length - IMPACTS_LIMIT} more`}`}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                {lang === 'he' ? 'אין כתבה נבחרת' : 'No article selected'}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {article?.url && (
            <div
              className="px-5 py-4 shrink-0"
              style={{ borderTop: '1px solid #1e293b' }}
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#a5b4fc',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(99,102,241,0.25)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(99,102,241,0.15)';
                }}
              >
                {lang === 'he' ? 'פתח כתבה מלאה' : 'Open full article'}
                <span>↗</span>
              </a>
            </div>
          )}
      </aside>
    </>
  );
}
