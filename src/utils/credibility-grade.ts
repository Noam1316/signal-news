import type { Source } from '@/lib/types';

export type Grade = 'A' | 'B' | 'C' | 'D';

// High-quality / well-known outlets (rough heuristic)
const QUALITY_SOURCES = new Set([
  'reuters', 'ap', 'associated press', 'bbc', 'haaretz', 'ynet',
  'times of israel', 'guardian', 'new york times', 'washington post',
  'bloomberg', 'axios', 'politico', 'npr', 'can', 'kan',
  'channel 12', 'channel12', 'n12', 'jpost', 'jerusalem post',
]);

function isQuality(name: string): boolean {
  const lower = name.toLowerCase();
  return [...QUALITY_SOURCES].some(q => lower.includes(q));
}

export function computeGrade(sources: Source[]): Grade {
  if (!sources?.length) return 'D';
  const count = sources.length;
  const qualityCount = sources.filter(s => isQuality(s.name)).length;
  const qualityRatio = qualityCount / count;

  if (count >= 4 && qualityRatio >= 0.5) return 'A';
  if (count >= 3 && qualityRatio >= 0.33) return 'B';
  if (count >= 2) return 'C';
  return 'D';
}

export const GRADE_STYLE: Record<Grade, { color: string; bg: string; title: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', title: 'Multi-source, high-quality' },
  B: { color: 'text-yellow-400',  bg: 'bg-yellow-400/10  border-yellow-400/30',  title: 'Good source coverage' },
  C: { color: 'text-orange-400',  bg: 'bg-orange-400/10  border-orange-400/30',  title: 'Limited sources — verify' },
  D: { color: 'text-red-400',     bg: 'bg-red-400/10     border-red-400/30',     title: 'Single source — use caution' },
};
