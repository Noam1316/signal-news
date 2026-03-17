'use client';

import { LocalizedText } from '@/lib/types';
import { useLanguage } from '@/i18n/context';

interface SoWhatProps {
  items: LocalizedText[];
}

export default function SoWhat({ items }: SoWhatProps) {
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {ui('soWhat')}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
            {t(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
