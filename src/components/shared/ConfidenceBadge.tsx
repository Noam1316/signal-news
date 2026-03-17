'use client';

import { Confidence } from '@/lib/types';
import { confidenceBg } from '@/lib/utils';
import { useLanguage } from '@/i18n/context';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const { ui } = useLanguage();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${confidenceBg(confidence)}`}
    >
      {ui(confidence)}
    </span>
  );
}
