'use client';

import { useLanguage } from '@/i18n/context';

interface SourceLanguageInfo {
  language: string;
  flag: string;
  sources: string[];
  articleCount: number;
}

const SOURCE_LANGUAGES: SourceLanguageInfo[] = [
  { language: 'Hebrew', flag: '🇮🇱', sources: ['Ynet', 'Haaretz', 'Kan', 'Walla', 'Mako', 'N12', 'Israel Hayom', 'Arutz 7', 'Channel 14', 'Maariv', 'Globes', 'Calcalist'], articleCount: 85 },
  { language: 'English', flag: '🇬🇧', sources: ['BBC', 'Reuters', 'AP', 'CNN', 'Guardian', 'NYT', 'JPost', 'Times of Israel', 'i24', 'Sky News', 'WSJ'], articleCount: 62 },
  { language: 'Arabic', flag: '🇸🇦', sources: ['Al Jazeera', 'Al Arabiya', 'BBC Arabic'], articleCount: 15 },
  { language: 'French', flag: '🇫🇷', sources: ['France 24'], articleCount: 5 },
  { language: 'German', flag: '🇩🇪', sources: ['Deutsche Welle'], articleCount: 4 },
  { language: 'Russian', flag: '🇷🇺', sources: ['RT (monitored)'], articleCount: 3 },
];

export default function LanguageSources() {
  const { lang } = useLanguage();
  const totalSources = SOURCE_LANGUAGES.reduce((s, l) => s + l.sources.length, 0);
  const totalArticles = SOURCE_LANGUAGES.reduce((s, l) => s + l.articleCount, 0);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🌐 {lang === 'he' ? 'מקורות רב-לשוניים' : 'Multi-Language Sources'}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">
          {totalSources} {lang === 'he' ? 'מקורות' : 'sources'} · {SOURCE_LANGUAGES.length} {lang === 'he' ? 'שפות' : 'languages'} · ~{totalArticles} {lang === 'he' ? 'כתבות/שעה' : 'articles/hr'}
        </p>
      </div>

      <div className="space-y-3">
        {SOURCE_LANGUAGES.map(l => (
          <div key={l.language} className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{l.flag}</span>
                <span className="text-sm font-semibold text-white">{l.language}</span>
                <span className="text-[10px] text-gray-500">{l.sources.length} sources</span>
              </div>
              <span className="text-[10px] text-gray-500">~{l.articleCount} {lang === 'he' ? 'כתבות/שעה' : 'art/hr'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {l.sources.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
                  {s}
                </span>
              ))}
            </div>
            {/* Coverage bar */}
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500/80 to-yellow-400/40 rounded-full"
                style={{ width: `${(l.articleCount / totalArticles) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
