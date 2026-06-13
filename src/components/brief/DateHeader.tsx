'use client';

import { useLanguage } from '@/i18n/context';
import { formatDate } from '@/lib/utils';

export default function DateHeader() {
  const { ui, lang, dir } = useLanguage();
  const today = new Date().toISOString();

  return (
    <header dir={dir} className="mb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-6 rounded-full bg-yellow-400 block" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{ui('todaysBrief')}</h1>
          </div>
          <span className="hidden sm:inline text-xs text-gray-600 font-mono border border-gray-800 px-2 py-0.5 rounded">
            {formatDate(today, lang)}
          </span>
        </div>
        <a
          href="/brief/print"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-yellow-400 hover:border-yellow-400/40 transition-colors"
        >
          <span>📄</span>
          <span className="hidden sm:inline">{lang === 'he' ? 'תקציר מלא' : 'Full Brief'}</span>
        </a>
      </div>
      <p className="text-xs text-gray-600 italic mt-1 ms-4">{ui('slogan')}</p>
    </header>
  );
}
