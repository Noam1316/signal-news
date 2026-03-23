'use client';

import { useLanguage } from '@/i18n/context';
import type { Source } from '@/lib/types';

// Source → leaning mapping (mirrors media-bias.ts SOURCE_BIAS_DB)
const SOURCE_LEAN: Record<string, 'left' | 'center' | 'right'> = {
  'Haaretz': 'left', 'הארץ': 'left',
  'The Guardian': 'left', 'Al Jazeera': 'left', 'Middle East Eye': 'left',
  'CNN': 'left', 'NYT': 'left', 'New York Times': 'left',
  'Ynet': 'center', 'ynet': 'center', 'Mako': 'center',
  'Kan': 'center', 'כאן': 'center', 'Walla': 'center',
  'BBC': 'center', 'Reuters': 'center', 'France24': 'center',
  'DW': 'center', 'AP': 'center', 'Times of Israel': 'center',
  'Calcalist': 'center', 'Globes': 'center', 'i24NEWS': 'center',
  'The Economist': 'center', 'Foreign Policy': 'center', 'Al-Monitor': 'center',
  'Israel Hayom': 'right', 'ישראל היום': 'right',
  'Jerusalem Post': 'right', 'JPost': 'right',
  'Channel 14': 'right', 'ערוץ 14': 'right',
  'INN': 'right', 'Arutz Sheva': 'right',
  'Sky News': 'right', 'Arab News': 'right', 'The National': 'right',
  'Fox News': 'right',
};

function classifySource(name: string): 'left' | 'center' | 'right' {
  // Exact match
  if (SOURCE_LEAN[name]) return SOURCE_LEAN[name];
  // Partial match
  const lower = name.toLowerCase();
  for (const [key, lean] of Object.entries(SOURCE_LEAN)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return lean;
    }
  }
  return 'center';
}

interface BiasBarProps {
  sources: Source[];
  compact?: boolean;
}

export default function BiasBar({ sources, compact = false }: BiasBarProps) {
  const { lang } = useLanguage();

  if (!sources || sources.length < 2) return null;

  const counts = { left: 0, center: 0, right: 0 };
  sources.forEach(s => { counts[classifySource(s.name)]++; });
  const total = sources.length;

  const leftPct = Math.round((counts.left / total) * 100);
  const centerPct = Math.round((counts.center / total) * 100);
  const rightPct = 100 - leftPct - centerPct;

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={`${lang === 'he' ? 'שמאל' : 'Left'}: ${leftPct}% | ${lang === 'he' ? 'מרכז' : 'Center'}: ${centerPct}% | ${lang === 'he' ? 'ימין' : 'Right'}: ${rightPct}%`}>
        <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-gray-800">
          {leftPct > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${leftPct}%` }} />}
          {centerPct > 0 && <div className="bg-gray-400 transition-all" style={{ width: `${centerPct}%` }} />}
          {rightPct > 0 && <div className="bg-red-500 transition-all" style={{ width: `${rightPct}%` }} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
        {leftPct > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${leftPct}%` }} />}
        {centerPct > 0 && <div className="bg-gray-400 transition-all" style={{ width: `${centerPct}%` }} />}
        {rightPct > 0 && <div className="bg-red-500 transition-all" style={{ width: `${rightPct}%` }} />}
      </div>
      <div className="flex justify-between text-[9px] text-gray-500">
        <span className="text-blue-400">{lang === 'he' ? 'שמאל' : 'L'} {leftPct}%</span>
        <span className="text-gray-400">{lang === 'he' ? 'מרכז' : 'C'} {centerPct}%</span>
        <span className="text-red-400">{lang === 'he' ? 'ימין' : 'R'} {rightPct}%</span>
      </div>
    </div>
  );
}
