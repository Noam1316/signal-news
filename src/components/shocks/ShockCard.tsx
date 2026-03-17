'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { ShockEvent, ShockType } from '@/lib/types';
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

  const glowClass = shock.confidence === 'high' ? 'animate-pulse-glow' : '';

  return (
    <article
      dir={dir}
      onClick={shock.relatedStorySlug ? () => router.push(`/story/${shock.relatedStorySlug}`) : undefined}
      className={`rounded-xl bg-gray-900/80 border border-gray-800 border-l-4 ${borderColors[shock.type]} p-5 space-y-3 ${glowClass} ${shock.relatedStorySlug ? 'cursor-pointer hover:bg-gray-800/80 transition-all' : ''}`}
    >
      {/* Top: badge + timestamp */}
      <div className="flex items-center justify-between">
        <ShockTypeBadge type={shock.type} />
        <span className="text-xs text-gray-500">{timeAgo(shock.timestamp, lang)}</span>
      </div>

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
