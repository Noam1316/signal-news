'use client';

import { useLanguage } from '@/i18n/context';
import { formatDate } from '@/lib/utils';

export default function DateHeader() {
  const { ui, lang } = useLanguage();
  const today = new Date().toISOString();

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{ui('todaysBrief')}</h1>
      <p className="text-sm text-gray-400 mt-1">{formatDate(today, lang)}</p>
      <p className="text-sm text-gray-500 italic mt-2">{ui('slogan')}</p>
    </header>
  );
}
