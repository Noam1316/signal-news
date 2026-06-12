'use client';

import { useState } from 'react';
import { Confidence, SignalComponents } from '@/lib/types';
import { likelihoodColor } from '@/lib/utils';
import { useLanguage } from '@/i18n/context';

interface LikelihoodMeterProps {
  value: number;
  label: Confidence;
  showLabel?: boolean;
  /** When provided, the meter becomes clickable and expands a component breakdown */
  components?: SignalComponents;
}

const COMPONENT_META: Array<{
  key: keyof SignalComponents;
  max: number;
  he: string;
  en: string;
  color: string;
}> = [
  { key: 'verification', max: 30, he: 'אימות מקורות',  en: 'Verification', color: 'bg-emerald-400' },
  { key: 'strength',     max: 25, he: 'עוצמת סיגנל',   en: 'Strength',     color: 'bg-yellow-400' },
  { key: 'breadth',      max: 20, he: 'רוחב כיסוי',    en: 'Breadth',      color: 'bg-blue-400' },
  { key: 'freshness',    max: 15, he: 'רעננות',        en: 'Freshness',    color: 'bg-purple-400' },
  { key: 'consensus',    max: 10, he: 'קונסנזוס',      en: 'Consensus',    color: 'bg-gray-400' },
];

export default function LikelihoodMeter({ value, label, showLabel = false, components }: LikelihoodMeterProps) {
  const { ui, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const color = likelihoodColor(value);
  const clamped = Math.max(0, Math.min(100, value));
  const isHe = lang === 'he';

  const meter = (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 shrink-0">
        {isHe ? 'מדד סיגנל' : 'Signal Index'}
      </span>
      <span className="text-sm font-mono font-semibold min-w-[3ch] text-end" style={{ color }}>
        {clamped}
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
      {components && (
        <span className="text-[9px] text-gray-600 shrink-0 select-none">{open ? '▴' : '▾'}</span>
      )}
    </div>
  );

  if (!components) return meter;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-full text-start cursor-pointer"
        title={isHe ? 'לחץ לפירוק המדד' : 'Click for breakdown'}
      >
        {meter}
      </button>

      {open && (
        <div className="space-y-1 ps-1 pb-1" onClick={e => e.stopPropagation()}>
          <p className="text-[9px] text-gray-600 leading-snug">
            {isHe
              ? 'מדד עוצמת כיסוי ואימות (0–100) — לא הסתברות לאירוע'
              : 'Coverage & verification intensity (0–100) — not an event probability'}
          </p>
          {COMPONENT_META.map(c => {
            const v = components[c.key] ?? 0;
            return (
              <div key={c.key} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-20 shrink-0">{isHe ? c.he : c.en}</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.color} transition-all duration-500`}
                    style={{ width: `${(v / c.max) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-gray-500 w-9 shrink-0 text-end tabular-nums">
                  {v}/{c.max}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
