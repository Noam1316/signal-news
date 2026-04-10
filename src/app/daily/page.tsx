import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { detectShocks } from '@/services/shock-detector';
import type { Metadata } from 'next';

export const revalidate = 1800; // revalidate every 30 min

export async function generateMetadata(): Promise<Metadata> {
  const date = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return {
    title: `תדריך יומי — זיקוק | ${date}`,
    description: 'חמשת הסיפורים הגיאופוליטיים החשובים ביותר היום, מנותחים ע"י זיקוק.',
    openGraph: {
      title: `תדריך זיקוק — ${date}`,
      description: 'מודיעין גיאופוליטי יומי. מנותח. מסווג. לפני השוק.',
      type: 'article',
    },
  };
}

function LikelihoodBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 45 ? 'bg-yellow-400' : 'bg-red-500';
  const textColor = value >= 70 ? 'text-emerald-400' : value >= 45 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{value}%</span>
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
    </div>
  );
}

export default async function DailyPage() {
  const articles = await getCachedArticles();
  const stories = generateStories(articles, 5);
  const shocks = detectShocks(articles);
  const highShocks = shocks.filter(s => s.confidence === 'high').slice(0, 3);

  const today = new Date();
  const dateHe = today.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dateEn = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeHe = today.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

  return (
    <main dir="rtl" className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📡</span>
            <div>
              <h1 className="text-xl font-bold text-white">תדריך יומי — זיקוק</h1>
              <p className="text-xs text-gray-500">{dateHe} · עודכן {timeHe}</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            חמשת הסיפורים הגיאופוליטיים החשובים ביותר היום, מסוננים ומדורגים ע"י מנוע ה-AI של זיקוק מתוך {articles.length}+ כתבות.
          </p>

          {/* Share bar */}
          <div className="mt-4 flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`📡 תדריך זיקוק — ${dateHe}\nמודיעין גיאופוליטי יומי:\n${typeof window !== 'undefined' ? window.location.href : 'https://signal-news-noam1316s-projects.vercel.app/daily'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366]
                         hover:bg-[#25D366]/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              שתף בוואטסאפ
            </a>
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500
                         transition-colors"
            >
              ← לדאשבורד המלא
            </a>
            <span className="text-[10px] text-gray-600 ms-auto">{dateEn}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Shocks alert */}
        {highShocks.length > 0 && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span>⚡</span>
              <span>{highShocks.length === 1 ? 'זעזוע חדשותי זוהה היום' : `${highShocks.length} זעזועים חדשותיים זוהו היום`}</span>
            </div>
            {highShocks.map((shock, i) => (
              <div key={i} className="text-sm text-orange-200">
                {typeof shock.headline === 'string' ? shock.headline : (shock.headline?.he ?? shock.headline?.en ?? '')}
              </div>
            ))}
          </div>
        )}

        {/* Stories */}
        {stories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-sm">אוסף נתונים... נסה שוב בעוד מספר דקות.</p>
          </div>
        ) : (
          stories.map((story, i) => {
            const headline = typeof story.headline === 'string' ? story.headline : story.headline.he || story.headline.en;
            const summary = typeof story.summary === 'string' ? story.summary : story.summary.he || story.summary.en;
            const category = typeof story.category === 'string' ? story.category : story.category.he || story.category.en;
            const why = typeof story.why === 'string' ? story.why : story.why?.he || story.why?.en || '';
            const label = story.likelihoodLabel === 'high' ? 'גבוה' : story.likelihoodLabel === 'medium' ? 'בינוני' : 'נמוך';

            return (
              <article key={story.slug} className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 space-y-3">
                {/* Number + category */}
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{category}</span>
                  {story.isSignal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold">
                      SIGNAL ⚡
                    </span>
                  )}
                  <span className="text-[10px] text-gray-600 ms-auto">
                    {story.sources?.length ?? 0} מקורות
                  </span>
                </div>

                {/* Headline */}
                <h2 className="text-base font-semibold leading-snug text-white">{headline}</h2>

                {/* Summary */}
                <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>

                {/* Likelihood bar */}
                <LikelihoodBar value={story.likelihood} label={label} />

                {/* Why */}
                {why && (
                  <p className="text-xs text-gray-500 italic">{why}</p>
                )}

                {/* Source links */}
                {story.sources && story.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {story.sources.slice(0, 4).map(src => (
                      <a
                        key={src.name}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700
                                   text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                      >
                        {src.name} ↗
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8 space-y-2">
          <p className="text-xs text-gray-600">
            מופעל ע"י <a href="/dashboard" className="text-yellow-400/70 hover:text-yellow-400">זיקוק</a> — מודיעין גיאופוליטי בזמן אמת
          </p>
          <p className="text-[10px] text-gray-700">
            מנתח {articles.length}+ כתבות מ-28 ערוצי RSS · מתעדכן כל 30 דקות
          </p>
        </div>
      </div>
    </main>
  );
}
