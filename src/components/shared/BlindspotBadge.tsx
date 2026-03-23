'use client';

import { useLanguage } from '@/i18n/context';
import type { Source } from '@/lib/types';

// Same source classification as BiasBar
const LEFT_SOURCES = new Set([
  'haaretz', 'הארץ', 'guardian', 'al jazeera', 'middle east eye', 'cnn', 'nyt', 'new york times',
]);
const RIGHT_SOURCES = new Set([
  'israel hayom', 'ישראל היום', 'jerusalem post', 'jpost', 'channel 14', 'ערוץ 14',
  'inn', 'arutz sheva', 'sky news', 'arab news', 'fox news',
]);

function isLeftSource(name: string): boolean {
  const lower = name.toLowerCase();
  return [...LEFT_SOURCES].some(s => lower.includes(s));
}
function isRightSource(name: string): boolean {
  const lower = name.toLowerCase();
  return [...RIGHT_SOURCES].some(s => lower.includes(s));
}

interface Props {
  sources: Source[];
}

export default function BlindspotBadge({ sources }: Props) {
  const { lang } = useLanguage();

  if (!sources || sources.length < 2) return null;

  const hasLeft = sources.some(s => isLeftSource(s.name));
  const hasRight = sources.some(s => isRightSource(s.name));

  // Only show if covered by one side exclusively
  if (hasLeft && hasRight) return null;
  if (!hasLeft && !hasRight) return null;

  const side = hasLeft ? 'left' : 'right';
  const label = side === 'left'
    ? (lang === 'he' ? 'כיסוי שמאלי בלבד' : 'Left-only coverage')
    : (lang === 'he' ? 'כיסוי ימני בלבד' : 'Right-only coverage');

  const color = side === 'left'
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${color}`}
      title={lang === 'he' ? 'נקודה עיוורת — מכוסה רק ע"י צד אחד של הספקטרום' : 'Blindspot — covered by only one side of the spectrum'}
    >
      🔍 {label}
    </span>
  );
}
