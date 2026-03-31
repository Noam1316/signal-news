'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

interface TickerItem {
  slug: string;
  headline: string;
  likelihood: number;
  isSignal: boolean;
  isShock: boolean;
}

// CSS animation injected once
const TICKER_STYLE = `
@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-scroll 60s linear infinite;
}
.ticker-track:hover {
  animation-play-state: paused;
}
`;

export default function NewsTicker() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<TickerItem[]>([]);
  const styleRef = useRef(false);

  // Inject CSS once
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement('style');
    el.textContent = TICKER_STYLE;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/stories').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/shocks').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([storiesData, shocksData]) => {
      if (cancelled) return;

      const stories: BriefStory[] = storiesData?.stories || [];
      const shockSlugs = new Set<string>(
        (shocksData?.shocks || [])
          .filter((s: any) => s.confidence === 'high' || s.confidence === 'medium')
          .map((s: any) => s.relatedStorySlug)
          .filter(Boolean)
      );

      const built: TickerItem[] = stories
        .filter(s => s.likelihood >= 55 || s.isSignal || shockSlugs.has(s.slug))
        .sort((a, b) => {
          const aScore = (a.isSignal ? 20 : 0) + (shockSlugs.has(a.slug) ? 15 : 0) + a.likelihood;
          const bScore = (b.isSignal ? 20 : 0) + (shockSlugs.has(b.slug) ? 15 : 0) + b.likelihood;
          return bScore - aScore;
        })
        .slice(0, 10)
        .map(s => ({
          slug: s.slug,
          headline: (lang === 'he'
            ? (typeof s.headline === 'string' ? s.headline : s.headline?.he || s.headline?.en)
            : (typeof s.headline === 'string' ? s.headline : s.headline?.en || s.headline?.he)
          ) || '',
          likelihood: s.likelihood,
          isSignal: !!s.isSignal,
          isShock: shockSlugs.has(s.slug),
        }))
        .filter(i => i.headline);

      setItems(built);
    });

    return () => { cancelled = true; };
  }, [lang]);

  if (!items.length) return null;

  // Duplicate items so the loop is seamless
  const doubled = [...items, ...items];

  return (
    <div
      dir="ltr"
      className="w-full bg-gray-950 border-b border-gray-800/80 overflow-hidden h-8 flex items-center"
      style={{ zIndex: 60 }}
    >
      {/* LIVE badge */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 border-e border-gray-800 h-full bg-red-950/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-[10px] font-black tracking-widest text-red-400 uppercase whitespace-nowrap">
          {lang === 'he' ? 'חי' : 'LIVE'}
        </span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track">
          {doubled.map((item, idx) => {
            const dotColor = item.isShock
              ? 'bg-red-500'
              : item.isSignal
                ? 'bg-yellow-400'
                : item.likelihood >= 70
                  ? 'bg-emerald-400'
                  : 'bg-gray-600';

            return (
              <a
                key={`${item.slug}-${idx}`}
                href={`/story/${item.slug}`}
                className="group inline-flex items-center gap-2 px-5 whitespace-nowrap border-e border-gray-800/50 hover:bg-gray-900/60 transition-colors h-8"
                tabIndex={idx < items.length ? 0 : -1}
                aria-hidden={idx >= items.length}
              >
                {/* Dot indicator */}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />

                {/* Badge */}
                {item.isShock && (
                  <span className="text-[9px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-1.5 py-px rounded">
                    {lang === 'he' ? 'זעזוע' : 'SHOCK'}
                  </span>
                )}
                {!item.isShock && item.isSignal && (
                  <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-px rounded">
                    ⚡ {lang === 'he' ? 'סיגנל' : 'SIGNAL'}
                  </span>
                )}

                {/* Headline */}
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors max-w-[340px] truncate">
                  {item.headline}
                </span>

                {/* Likelihood */}
                <span className={`text-[10px] font-mono font-bold shrink-0 ${
                  item.likelihood >= 70 ? 'text-emerald-400'
                  : item.likelihood >= 50 ? 'text-yellow-400'
                  : 'text-gray-500'
                }`}>
                  {item.likelihood}%
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
