'use client';

import { ShockType } from '@/lib/types';
import { useLanguage } from '@/i18n/context';

interface ShockTypeBadgeProps {
  type: ShockType;
}

const config: Record<ShockType, { bg: string; border: string; text: string; icon: string; labelKey: 'likelihoodShock' | 'narrativeShock' | 'fragmentationShock' }> = {
  likelihood: {
    bg: 'bg-orange-500/15',
    border: 'border-l-orange-500',
    text: 'text-orange-400',
    icon: '⚡',
    labelKey: 'likelihoodShock',
  },
  narrative: {
    bg: 'bg-purple-500/15',
    border: 'border-l-purple-500',
    text: 'text-purple-400',
    icon: '💬',
    labelKey: 'narrativeShock',
  },
  fragmentation: {
    bg: 'bg-teal-500/15',
    border: 'border-l-teal-500',
    text: 'text-teal-400',
    icon: '🔀',
    labelKey: 'fragmentationShock',
  },
};

export default function ShockTypeBadge({ type }: ShockTypeBadgeProps) {
  const { ui } = useLanguage();
  const c = config[type];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border-l-2 ${c.bg} ${c.border} ${c.text}`}
    >
      <span>{c.icon}</span>
      {ui(c.labelKey)}
    </span>
  );
}
