'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
import { formatDate } from '@/lib/utils';

export default function DateHeader() {
  const { ui, lang } = useLanguage();
  const today = new Date().toISOString();

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ui('todaysBrief')}</h1>
        <p className="text-sm text-gray-400 mt-1">{formatDate(today, lang)}</p>
        <p className="text-sm text-gray-500 italic mt-2">{ui('slogan')}</p>
      </div>
      <Link
        href="/brief"
        className="shrink-0 mt-1 text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:border-indigo-400/50 transition-colors"
      >
        {lang === 'he' ? 'תקציר מלא ↗' : 'Full Brief ↗'}
      </Link>
    </header>
  );
}
