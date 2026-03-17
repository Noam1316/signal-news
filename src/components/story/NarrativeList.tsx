'use client';

import { Narrative } from '@/lib/types';
import { useLanguage } from '@/i18n/context';
import SourceList from '@/components/shared/SourceList';

interface NarrativeListProps {
  narratives: Narrative[];
}

function TrendIndicator({ trend }: { trend: Narrative['trend'] }) {
  const { ui } = useLanguage();

  const config = {
    growing: { arrow: '\u25B2', color: 'text-green-400', label: ui('growing') },
    declining: { arrow: '\u25BC', color: 'text-red-400', label: ui('declining') },
    stable: { arrow: '\u2014', color: 'text-gray-400', label: ui('stable') },
  };

  const { arrow, color, label } = config[trend];

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <span className="text-[10px]">{arrow}</span>
      {label}
    </span>
  );
}

export default function NarrativeList({ narratives }: NarrativeListProps) {
  const { ui, t } = useLanguage();

  return (
    <div>
      <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">
        {ui('narratives')}
      </h3>
      <div className="flex flex-col gap-3">
        {narratives.map((narrative) => (
          <div
            key={narrative.id}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <TrendIndicator trend={narrative.trend} />
            </div>
            <p className="font-medium text-gray-100 mb-1">
              {t(narrative.thesis)}
            </p>
            <p className="text-sm text-gray-400 mb-2">
              {t(narrative.keyFrame)}
            </p>
            <SourceList sources={narrative.sources} />
          </div>
        ))}
      </div>
    </div>
  );
}
