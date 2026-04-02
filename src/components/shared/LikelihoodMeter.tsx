'use client';

import { Confidence } from '@/lib/types';
import { likelihoodColor } from '@/lib/utils';
import { useLanguage } from '@/i18n/context';

interface LikelihoodMeterProps {
  value: number;
  label: Confidence;
  showLabel?: boolean;
}

export default function LikelihoodMeter({ value, label, showLabel = false }: LikelihoodMeterProps) {
  const { ui, lang } = useLanguage();
  const color = likelihoodColor(value);
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 shrink-0">
        {lang === 'he' ? 'סבירות' : 'Likelihood'}
      </span>
      <span className="text-sm font-mono font-semibold min-w-[3ch] text-end" style={{ color }}>
        {clamped}%
      </span>
      <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden min-w-[40px]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400">{ui(label)}</span>
      )}
    </div>
  );
}
