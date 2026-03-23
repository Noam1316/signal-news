'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { GroupedArticle } from '@/utils/news-grouper';

interface Props {
  group: GroupedArticle;
}

/** Extract hostname for favicon */
function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return ''; }
}

function FaviconImg({ url, name }: { url: string; name: string }) {
  const domain = getDomain(url);
  const src = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={16} height={16} className="rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <span className="text-xs font-bold text-gray-400">{name.slice(0, 2).toUpperCase()}</span>
  );
}

export default function GroupedStoryCard({ group }: Props) {
  const { lang, dir } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);

  const active = group.articles[activeIdx] ?? group.primaryArticle;

  // Deduplicate sources (keep one article per source name)
  const uniqueBySource: typeof group.articles = [];
  const seenSources = new Set<string>();
  group.articles.forEach(a => {
    if (!seenSources.has(a.sourceName)) {
      seenSources.add(a.sourceName);
      uniqueBySource.push(a);
    }
  });

  // Fix activeIdx after dedup
  const activeSource = group.articles[activeIdx]?.sourceName;
  const dedupedActiveIdx = uniqueBySource.findIndex(a => a.sourceName === activeSource);
  const displayIdx = dedupedActiveIdx >= 0 ? dedupedActiveIdx : 0;

  const sourceCount = uniqueBySource.length;

  // Truncate description
  const desc = active.description?.replace(/<[^>]*>/g, '').slice(0, 160) ?? '';

  return (
    <article
      dir={dir}
      className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group flex flex-col gap-3"
    >
      {/* Top row: source count + time */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="text-indigo-400 font-semibold">{sourceCount}</span>
          &nbsp;{lang === 'he' ? 'מקורות' : 'sources'}
        </span>
        <span>{active.pubDate ? new Date(active.pubDate).toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
      </div>

      {/* Headline — switches with active source */}
      <h3 className="font-semibold text-sm sm:text-base leading-snug text-white line-clamp-2 min-h-[2.5rem]">
        {active.title}
      </h3>

      {/* Description */}
      {desc && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{desc}</p>
      )}

      {/* Shared keywords */}
      {group.sharedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.sharedKeywords.slice(0, 5).map(kw => (
            <span key={kw} className="text-[10px] px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-full border border-indigo-800/40">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Source switcher row */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-800/60">
        {uniqueBySource.map((article, i) => {
          const isActive = i === displayIdx;
          return (
            <button
              key={article.id}
              onClick={() => {
                // Find the index in original articles[]
                const origIdx = group.articles.findIndex(a => a.sourceName === article.sourceName);
                setActiveIdx(origIdx >= 0 ? origIdx : 0);
              }}
              title={article.sourceName}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                isActive
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              <FaviconImg url={article.link} name={article.sourceName} />
              <span className="max-w-[80px] truncate">{article.sourceName}</span>
            </button>
          );
        })}
      </div>

      {/* CTA — opens the active article */}
      <a
        href={active.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {lang === 'he' ? `קרא ב-${active.sourceName}` : `Read on ${active.sourceName}`}
        <span className="text-[10px]">{dir === 'rtl' ? '←' : '→'}</span>
      </a>
    </article>
  );
}
