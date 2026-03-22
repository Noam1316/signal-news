'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockEvent, ShockType, BriefStory } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import ShockTypeBadge from '@/components/shocks/ShockTypeBadge';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';
import SourceList from '@/components/shared/SourceList';
import DeltaIndicator from '@/components/shared/DeltaIndicator';

interface ShockCardProps {
  shock: ShockEvent;
}

const borderColors: Record<ShockType, string> = {
  likelihood: 'border-l-orange-500',
  narrative: 'border-l-purple-500',
  fragmentation: 'border-l-teal-500',
};

export default function ShockCard({ shock }: ShockCardProps) {
  const { lang, dir, t, ui } = useLanguage();
  const router = useRouter();
  const [relatedStory, setRelatedStory] = useState<BriefStory | null>(null);

  // Fetch related story snippet if slug exists
  useEffect(() => {
    if (!shock.relatedStorySlug) return;
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const match = (data?.stories as BriefStory[] | undefined)?.find(
          s => s.slug === shock.relatedStorySlug
        );
        if (match) setRelatedStory(match);
      })
      .catch(() => { /* silent */ });
  }, [shock.relatedStorySlug]);

  const glowClass = shock.confidence === 'high' ? 'animate-pulse-glow' : '';

  return (
    <article
      dir={dir}
      className={`rounded-xl bg-gray-900/80 border border-gray-800 border-l-4 ${borderColors[shock.type]} p-5 space-y-3 ${glowClass} card-glow`}
    >
      {/* Top: badge + timestamp */}
      <div className="flex items-center justify-between">
        <ShockTypeBadge type={shock.type} />
        <span className="text-xs text-gray-500">{timeAgo(shock.timestamp, lang)}</span>
      </div>

      {/* Related story context — prominent, at top */}
      {relatedStory && (
        <div
          onClick={() => router.push(`/story/${relatedStory.slug}`)}
          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-yellow-400/5 border border-yellow-400/20 cursor-pointer hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-yellow-400/70 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <span>📋</span>
              {lang === 'he' ? 'קונטקסט — מהתקציר' : 'Context — from Brief'}
            </p>
            <p className="text-xs text-yellow-100 font-medium truncate">
              {lang === 'he' ? relatedStory.headline?.he : relatedStory.headline?.en}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="text-sm font-bold text-yellow-400">{relatedStory.likelihood}%</div>
            <div className={`text-[9px] font-medium ${relatedStory.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {relatedStory.delta >= 0 ? '+' : ''}{relatedStory.delta}%
            </div>
          </div>
        </div>
      )}

      {/* Headline */}
      <h3 className="font-semibold leading-snug">{t(shock.headline)}</h3>

      {/* What moved + delta + time window */}
      <div className="space-y-1">
        <p className="text-sm text-gray-300">{t(shock.whatMoved)}</p>
        <div className="flex items-center gap-3 text-sm">
          <DeltaIndicator delta={shock.delta} />
          <span className="text-gray-500">{t(shock.timeWindow)}</span>
        </div>
      </div>

      {/* Why now */}
      <div>
        <span className="text-xs uppercase tracking-wider text-gray-500">{ui('whyNow')}</span>
        <p className="text-sm text-gray-300 mt-0.5">{t(shock.whyNow)}</p>
      </div>

      {/* Who's driving */}
      <div>
        <span className="text-xs uppercase tracking-wider text-gray-500">{ui('whoDriving')}</span>
        <p className="text-sm text-gray-300 mt-0.5">{t(shock.whoDriving)}</p>
      </div>

      {/* Confidence */}
      <ConfidenceBadge confidence={shock.confidence} />

      {/* Sources */}
      <SourceList sources={shock.sources} />
    </article>
  );
}
