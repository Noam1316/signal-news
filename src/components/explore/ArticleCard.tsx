'use client';

import { useLanguage } from '@/i18n/context';

interface Article {
  id: string;
  sourceId: string;
  sourceName: string;
  lensCategory: string;
  language: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  fetchedAt: string;
}

const LENS_STYLES: Record<string, { border: string; badge: string; label: { en: string; he: string } }> = {
  'il-mainstream': {
    border: 'border-s-blue-500/60',
    badge: 'bg-blue-500/15 text-blue-400',
    label: { en: 'IL Mainstream', he: 'מיינסטרים' },
  },
  'il-partisan': {
    border: 'border-s-purple-500/60',
    badge: 'bg-purple-500/15 text-purple-400',
    label: { en: 'IL Partisan', he: 'מפלגתי' },
  },
  international: {
    border: 'border-s-emerald-500/60',
    badge: 'bg-emerald-500/15 text-emerald-400',
    label: { en: 'International', he: 'בינלאומי' },
  },
};

function timeAgo(dateStr: string, lang: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return lang === 'he' ? 'עכשיו' : 'just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === 'he' ? `לפני ${m} דק'` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === 'he' ? `לפני ${h} שע'` : `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return lang === 'he' ? `לפני ${d} ימים` : `${d}d ago`;
}

export default function ArticleCard({ article }: { article: Article }) {
  const { lang, t } = useLanguage();
  const style = LENS_STYLES[article.lensCategory] || LENS_STYLES.international;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border-s-2 ${style.border} ps-4 py-3 group
                  hover:bg-gray-800/30 rounded-e-lg transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100 leading-snug group-hover:text-yellow-400 transition-colors line-clamp-2">
            {article.title}
          </p>
          {article.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {article.description.slice(0, 200)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>
          {t(style.label)}
        </span>
        <span className="text-[10px] text-gray-500 font-medium">
          {article.sourceName}
        </span>
        {article.pubDate && (
          <>
            <span className="text-gray-700">&middot;</span>
            <span className="text-[10px] text-gray-600">
              {timeAgo(article.pubDate, lang)}
            </span>
          </>
        )}
        <svg
          className="w-3 h-3 text-gray-600 ms-auto opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}
