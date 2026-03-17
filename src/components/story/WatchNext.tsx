'use client';

import { LocalizedText } from '@/lib/types';
import { useLanguage } from '@/i18n/context';

interface WatchNextProps {
  items: { trigger: LocalizedText; implication: LocalizedText }[];
}

export default function WatchNext({ items }: WatchNextProps) {
  const { ui, t } = useLanguage();

  return (
    <div>
      <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3 flex items-center gap-1.5">
        <svg
          className="w-3.5 h-3.5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {ui('watchNext')}
      </h3>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  {ui('trigger')}:
                </span>
                <p className="text-sm text-gray-200 mt-0.5">{t(item.trigger)}</p>
              </div>
              <span className="text-amber-500/60 text-lg hidden sm:block shrink-0 pt-2">
                &rarr;
              </span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  {ui('implication')}:
                </span>
                <p className="text-sm text-gray-200 mt-0.5">{t(item.implication)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
