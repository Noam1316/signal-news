'use client';

import { useLanguage } from '@/i18n/context';
import { formatDate } from '@/lib/utils';

export default function DateHeader() {
  const { ui, lang } = useLanguage();
  const today = new Date().toISOString();

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{ui('todaysBrief')}</h1>
        <a
          href="/brief/print"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-1 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
        >
          <span>📄</span>
          <span>{lang === 'he' ? 'תקציר מלא' : 'Full Brief'}</span>
        </a>
      </div>
      <p className="text-sm text-gray-400 mt-1">{formatDate(today, lang)}</p>
      <p className="text-sm text-gray-500 italic mt-1">{ui('slogan')}</p>
    </header>
  );
}
