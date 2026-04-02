'use client';

import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';

interface DailySummaryProps {
  stories: BriefStory[];
  shocks: ShockEvent[];
}

export default function DailySummary({ stories, shocks }: DailySummaryProps) {
  const { lang } = useLanguage();

  if (stories.length === 0) return null;

  const top = [...stories].sort((a, b) => b.likelihood - a.likelihood).slice(0, 3);
  const hotShocks = shocks.filter(s => s.confidence === 'high').slice(0, 2);
  const shockedSlugs = new Set(shocks.map(s => s.relatedStorySlug).filter(Boolean));
  const linkedCount = stories.filter(s => shockedSlugs.has(s.slug)).length;

  if (lang === 'he') {
    const topTitles = top.map(s => s.headline?.he || s.headline?.en || '').filter(Boolean);
    const shockTitles = hotShocks.map(s => s.headline?.he || s.headline?.en || '').filter(Boolean);

    return (
      <div className="rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3.5 space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider flex-wrap">
          <span>🧠</span>
          <span>סיכום מודיעיני יומי</span>
          {linkedCount > 0 && (
            <span className="text-orange-400 font-medium normal-case">
              ⚡ {linkedCount} סיפורים עם זעזועים פעילים
            </span>
          )}
        </div>
        <p className="text-sm text-gray-200 leading-relaxed" dir="rtl">
          {topTitles[0] && (
            <>
              הנושא המוביל כרגע הוא <span className="text-white font-medium">{topTitles[0]}</span>
              {topTitles[1] && <>, לצד <span className="text-white font-medium">{topTitles[1]}</span></>}
              {topTitles[2] && <> ו<span className="text-white font-medium">{topTitles[2]}</span></>}.
              {shockTitles[0] && (
                <> <span className="text-orange-300">זעזוע בסבירות גבוהה זוהה: {shockTitles[0]}.</span></>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/brief/print"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
          >
            📄 {lang === 'he' ? 'תקציר מלא' : 'Full Brief'}
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `📡 *Zikuk — סיכום מודיעיני*\n\n` +
              (topTitles[0] ? `🔹 ${topTitles[0]}\n` : '') +
              (topTitles[1] ? `🔹 ${topTitles[1]}\n` : '') +
              (shockTitles[0] ? `\n⚡ זעזוע: ${shockTitles[0]}\n` : '') +
              `\n🔗 ${typeof window !== 'undefined' ? window.location.origin : 'https://signal-news.vercel.app'}/dashboard`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:text-green-300 hover:border-green-500/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {lang === 'he' ? 'שתף' : 'Share'}
          </a>
        </div>
      </div>
    );
  }

  // English
  const topTitles = top.map(s => s.headline?.en || s.headline?.he || '').filter(Boolean);
  const shockTitles = hotShocks.map(s => s.headline?.en || s.headline?.he || '').filter(Boolean);

  return (
    <div className="rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3.5 space-y-2 mb-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider flex-wrap">
        <span>🧠</span>
        <span>Daily Intelligence Summary</span>
        {linkedCount > 0 && (
          <span className="text-orange-400 font-medium normal-case">
            ⚡ {linkedCount} {linkedCount === 1 ? 'story' : 'stories'} with active shocks
          </span>
        )}
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">
        {topTitles[0] && (
          <>
            The leading story is <span className="text-white font-medium">{topTitles[0]}</span>
            {topTitles[1] && <>, alongside <span className="text-white font-medium">{topTitles[1]}</span></>}
            {topTitles[2] && <> and <span className="text-white font-medium">{topTitles[2]}</span></>}.
            {shockTitles[0] && (
              <> <span className="text-orange-300">High-confidence shock detected: {shockTitles[0]}.</span></>
            )}
          </>
        )}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="/brief/print"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
        >
          📄 Full Brief
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `📡 *Zikuk — Daily Intel*\n\n` +
            (topTitles[0] ? `🔹 ${topTitles[0]}\n` : '') +
            (topTitles[1] ? `🔹 ${topTitles[1]}\n` : '') +
            (shockTitles[0] ? `\n⚡ Shock: ${shockTitles[0]}\n` : '') +
            `\n🔗 ${typeof window !== 'undefined' ? window.location.origin : 'https://signal-news.vercel.app'}/dashboard`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:text-green-300 hover:border-green-500/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Share
        </a>
      </div>
    </div>
  );
}
