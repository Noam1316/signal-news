'use client';

/**
 * ReturnBrief — "What changed since your last visit"
 *
 * Shows a dismissible banner when the user returns after ≥30 minutes.
 * Compares current stories against the snapshot saved on last exit.
 * Pure localStorage — no backend needed.
 *
 * Saved keys:
 *   signal_last_exit      — ISO timestamp of last page hide/unload
 *   signal_exit_snapshot  — JSON: Record<slug, likelihood>
 */

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

const EXIT_TIME_KEY     = 'signal_last_exit';
const EXIT_SNAPSHOT_KEY = 'signal_exit_snapshot';
const MIN_AWAY_MINUTES  = 30;    // don't show if away < 30 min
const MAX_ROWS          = 4;     // max change rows to show

interface Change {
  type: 'new' | 'up' | 'down';
  slug: string;
  headline: string;
  delta?: number;
  likelihood: number;
  category: string;
}

function loadSnapshot(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(EXIT_SNAPSHOT_KEY) || '{}'); } catch { return {}; }
}

function saveSnapshot(stories: BriefStory[]) {
  try {
    const snap: Record<string, number> = {};
    for (const s of stories) snap[s.slug] = s.likelihood;
    localStorage.setItem(EXIT_SNAPSHOT_KEY, JSON.stringify(snap));
    localStorage.setItem(EXIT_TIME_KEY, new Date().toISOString());
  } catch { /* silent */ }
}

function loadExitTime(): Date | null {
  try {
    const s = localStorage.getItem(EXIT_TIME_KEY);
    return s ? new Date(s) : null;
  } catch { return null; }
}

function minsAgo(d: Date): number {
  return Math.round((Date.now() - d.getTime()) / 60000);
}

function fmtAway(mins: number, isHe: boolean): string {
  if (mins < 60) return isHe ? `לפני ${mins} דק'` : `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (isHe) return m > 0 ? `לפני ${h}ש' ${m}ד'` : `לפני ${h} שעות`;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export default function ReturnBrief({ stories }: { stories: BriefStory[] }) {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const [dismissed, setDismissed] = useState(false);
  const [exitTime, setExitTime] = useState<Date | null>(null);
  const [snapshot, setSnapshot] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  // Load saved state on mount (client only)
  useEffect(() => {
    setExitTime(loadExitTime());
    setSnapshot(loadSnapshot());
    setMounted(true);
  }, []);

  // Register page-hide handler to save snapshot when user leaves
  useEffect(() => {
    if (!stories.length) return;
    const save = () => saveSnapshot(stories);
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    // Also save on visibility change (tab switch / minimize)
    const onVis = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [stories]);

  const { changes, awayMins } = useMemo(() => {
    if (!mounted || !exitTime || !stories.length || !Object.keys(snapshot).length) {
      return { changes: [], awayMins: 0 };
    }

    const away = minsAgo(exitTime);
    if (away < MIN_AWAY_MINUTES) return { changes: [], awayMins: away };

    const result: Change[] = [];
    const knownSlugs = new Set(Object.keys(snapshot));

    for (const s of stories) {
      const cat = isHe ? s.category.he : s.category.en;
      const headline = isHe ? s.headline.he : s.headline.en;
      const skipCat = s.category.en === 'General' || s.category.en === 'Sports';
      if (skipCat || !headline) continue;

      if (!knownSlugs.has(s.slug)) {
        // New story — wasn't in last snapshot
        if (s.isSignal) {
          result.push({ type: 'new', slug: s.slug, headline, likelihood: s.likelihood, category: cat });
        }
      } else {
        // Existing story — check likelihood delta
        const prev = snapshot[s.slug];
        const delta = Math.round(s.likelihood - prev);
        if (Math.abs(delta) >= 10) {
          result.push({
            type: delta > 0 ? 'up' : 'down',
            slug: s.slug,
            headline,
            delta,
            likelihood: s.likelihood,
            category: cat,
          });
        }
      }
    }

    // Sort: new first, then biggest movers
    result.sort((a, b) => {
      if (a.type === 'new' && b.type !== 'new') return -1;
      if (a.type !== 'new' && b.type === 'new') return 1;
      return Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
    });

    return { changes: result.slice(0, MAX_ROWS), awayMins: away };
  }, [mounted, exitTime, snapshot, stories, isHe]);

  if (!mounted || dismissed || changes.length === 0) return null;

  const TYPE_STYLE = {
    new:  { icon: '🆕', tagBg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',  tag: isHe ? 'חדש'  : 'NEW'  },
    up:   { icon: '⬆',  tagBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300', tag: '' },
    down: { icon: '⬇',  tagBg: 'bg-red-500/10 border-red-500/25 text-red-300',     tag: '' },
  };

  return (
    <div dir={dir} className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-yellow-400/10">
        <div className="flex items-center gap-2">
          <span className="text-base">👋</span>
          <span className="text-sm font-semibold text-gray-200">
            {isHe ? 'ברוך השב' : 'Welcome back'}
          </span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500">{fmtAway(awayMins, isHe)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-semibold">
            {changes.length} {isHe ? 'שינויים' : 'updates'}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors text-sm leading-none"
          aria-label="dismiss"
        >
          ✕
        </button>
      </div>

      {/* Change rows */}
      <div className="divide-y divide-white/[0.04]">
        {changes.map(c => {
          const style = TYPE_STYLE[c.type];
          const tag = c.type === 'new' ? style.tag : `${c.delta! > 0 ? '+' : ''}${c.delta}%`;
          return (
            <div key={c.slug} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-sm shrink-0 mt-0.5">{style.icon}</span>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums mt-0.5 ${style.tagBg}`}>
                {tag}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-snug line-clamp-1">{c.headline}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {c.category}{c.type !== 'new' ? ` · ${c.likelihood}% ${isHe ? 'כעת' : 'now'}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
