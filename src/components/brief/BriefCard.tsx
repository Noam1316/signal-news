'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import SignalLabel from '@/components/shared/SignalLabel';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SourceList from '@/components/shared/SourceList';

interface BriefCardProps {
  story: BriefStory;
}

export default function BriefCard({ story }: BriefCardProps) {
  const { t, dir } = useLanguage();
  const router = useRouter();

  return (
    <article
      dir={dir}
      onClick={() => router.push(`/story/${story.slug}`)}
      className="rounded-xl border border-gray-800 bg-gray-900/80 hover:bg-gray-800/80 transition-all cursor-pointer p-5 space-y-3"
    >
      {/* Top row: category + signal */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-400">
          {t(story.category)}
        </span>
        <SignalLabel isSignal={story.isSignal} />
      </div>

      {/* Headline */}
      <h2 className="text-lg font-semibold leading-snug">{t(story.headline)}</h2>

      {/* Summary */}
      <p className="text-sm text-gray-300 line-clamp-2">{t(story.summary)}</p>

      {/* Likelihood + Delta */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} />
        </div>
        <DeltaIndicator delta={story.delta} />
      </div>

      {/* Why */}
      <p className="text-sm italic text-gray-400">{t(story.why)}</p>

      {/* Sources */}
      <SourceList sources={story.sources} />
    </article>
  );
}
