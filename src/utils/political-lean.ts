import type { BriefStory } from '@/lib/types';

export type Lean = 'left' | 'center' | 'right';

// Source name → simplified political lean
const SOURCE_LEAN: Record<string, Lean> = {
  // Left
  haaretz: 'left', guardian: 'left', 'new york times': 'left', nyt: 'left',
  'washington post': 'left', wapo: 'left', cnn: 'left', msnbc: 'left',
  'the intercept': 'left', 'democracy now': 'left', '972': 'left',
  // Center
  reuters: 'center', 'associated press': 'center', ap: 'center',
  bbc: 'center', ynet: 'center', 'times of israel': 'center',
  axios: 'center', politico: 'center', npr: 'center', bloomberg: 'center',
  walla: 'center', n12: 'center', channel12: 'center', kan: 'center',
  // Right
  'jerusalem post': 'right', jpost: 'right', 'israel hayom': 'right',
  'arutz sheva': 'right', 'breitbart': 'right', 'fox news': 'right',
  'national review': 'right', 'the federalist': 'right',
};

function toLean(name: string): Lean | null {
  const lower = name.toLowerCase();
  for (const [key, lean] of Object.entries(SOURCE_LEAN)) {
    if (lower.includes(key)) return lean;
  }
  return null;
}

export function getStoryLean(story: BriefStory): Lean | null {
  if (!story.sources?.length) return null;
  const counts: Record<Lean, number> = { left: 0, center: 0, right: 0 };
  for (const src of story.sources) {
    const lean = toLean(src.name);
    if (lean) counts[lean]++;
  }
  const total = counts.left + counts.center + counts.right;
  if (total === 0) return null;
  // Return dominant; if tied favor center
  if (counts.left > counts.center && counts.left > counts.right) return 'left';
  if (counts.right > counts.center && counts.right > counts.left) return 'right';
  return 'center';
}

export const LEAN_LABEL: Record<Lean, { he: string; en: string; color: string; bg: string }> = {
  left:   { he: 'שמאל', en: 'Left',   color: 'text-blue-400',  bg: 'bg-blue-400/10 border-blue-400/30' },
  center: { he: 'מרכז', en: 'Center', color: 'text-gray-400',  bg: 'bg-gray-700/50 border-gray-600/30' },
  right:  { he: 'ימין', en: 'Right',  color: 'text-red-400',   bg: 'bg-red-400/10  border-red-400/30'  },
};
