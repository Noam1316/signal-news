'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

/* ── helpers ─────────────────────────────────────────────────── */

function likelihoodTier(pct: number) {
  if (pct >= 70) return 'high';
  if (pct >= 45) return 'medium';
  return 'low';
}

/** Multi-sentence intelligence assessment generated purely from data */
function buildAssessment(story: BriefStory, lang: 'he' | 'en'): string {
  const tier      = likelihoodTier(story.likelihood);
  const srcCount  = story.sources?.length ?? 0;
  const delta     = story.delta ?? 0;
  const isUp      = delta > 0;
  const absDelta  = Math.abs(delta);

  if (lang === 'he') {
    const tierLine =
      tier === 'high'
        ? `הסבירות הנוכחית של ${story.likelihood}% מעידה על אמינות גבוהה — המידע מגובה ע"י מספר מקורות עצמאיים ועקבי עם דפוסי עבר דומים.`
        : tier === 'medium'
          ? `הסבירות הנוכחית של ${story.likelihood}% מצביעה על מגמה מתפתחת; הנתון עדיין נמצא בטווח אי-ודאות אך מקבל מומנטום.`
          : `הסבירות הנוכחית של ${story.likelihood}% מסמנת סיגנל חלש יחסית — יש לעקוב אם יצטרפו מקורות נוספים לדיווח.`;

    const deltaLine = absDelta > 0
      ? `בשעות האחרונות ${isUp ? 'עלתה' : 'ירדה'} הסבירות ב-${absDelta}% — ${
          isUp
            ? 'שינוי כלפי מעלה מרמז על אירועים מאמתים או גידול בכיסוי התקשורתי.'
            : 'ירידה עשויה לשקף מידע מנטרל או ירידה בדיווח.'
        }`
      : `הסבירות יציבה — לא נרשם שינוי מהותי בשעות האחרונות.`;

    const srcLine =
      srcCount >= 5
        ? `${srcCount} מקורות מדווחים על הנושא, מה שמסמן כיסוי רחב ומאמת קונסנזוס.`
        : srcCount >= 3
          ? `${srcCount} מקורות מכסים את הנושא — כיסוי מרובה בסיסי עם מקום לאישוש נוסף.`
          : `${srcCount} מקור${srcCount === 1 ? '' : 'ות'} בלבד מדווח${srcCount === 1 ? '' : 'ים'} — זהירות: כיסוי דל מגביל את מהימנות הסיגנל.`;

    const signalLine = story.isSignal
      ? 'מסומן כ-Signal: הנושא חורג מרעש הרקע ומציין אנומליה סטטיסטית שדורשת מעקב.'
      : '';

    return [tierLine, deltaLine, srcLine, signalLine].filter(Boolean).join(' ');
  }

  // English
  const tierLine =
    tier === 'high'
      ? `A ${story.likelihood}% likelihood indicates high confidence — the signal is corroborated across multiple independent sources and consistent with historical patterns.`
      : tier === 'medium'
        ? `At ${story.likelihood}% likelihood, this is a developing trend still within uncertainty range, but gaining momentum across sources.`
        : `A ${story.likelihood}% likelihood marks a relatively weak signal — monitor for additional source corroboration before acting.`;

  const deltaLine = absDelta > 0
    ? `Likelihood has ${isUp ? 'risen' : 'fallen'} by ${absDelta}% in recent hours — ${
        isUp
          ? 'an upward shift suggests corroborating events or growing media coverage.'
          : 'a downward shift may reflect neutralizing information or declining coverage.'
      }`
    : 'Likelihood is stable — no material change detected in recent hours.';

  const srcLine =
    srcCount >= 5
      ? `${srcCount} sources are covering this story, indicating broad consensus across outlets.`
      : srcCount >= 3
        ? `${srcCount} sources cover this topic — moderate multi-source confirmation with room for further corroboration.`
        : `Only ${srcCount} source${srcCount === 1 ? '' : 's'} reporting — limited coverage constrains signal reliability.`;

  const signalLine = story.isSignal
    ? 'Flagged as a Signal: this topic exceeds background noise and marks a statistical anomaly warranting close monitoring.'
    : '';

  return [tierLine, deltaLine, srcLine, signalLine].filter(Boolean).join(' ');
}

/* ── component ───────────────────────────────────────────────── */

export default function StoryOfTheDay() {
  const { lang, dir } = useLanguage();
  const [story, setStory] = useState<BriefStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.stories?.length) {
          const scored = data.stories.map((s: BriefStory) => ({
            story: s,
            score: s.likelihood * (s.isSignal ? 1.3 : 1) * Math.log((s.sources?.length || 1) + 1),
          }));
          scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
          setStory(scored[0].story);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-2xl bg-gray-900/50 border border-gray-800 h-36 animate-pulse" />;
  }
  if (!story) return null;

  const headline  = lang === 'he' ? story.headline.he : story.headline.en;
  const summary   = lang === 'he' ? story.summary.he  : story.summary.en;
  const why       = lang === 'he' ? story.why?.he     : story.why?.en;
  const category  = lang === 'he' ? story.category?.he : story.category?.en;
  const assessment = buildAssessment(story, lang);

  const tier = likelihoodTier(story.likelihood);
  const likelihoodColor =
    tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-yellow-400' : 'text-red-400';
  const barColor =
    tier === 'high' ? 'bg-emerald-400' : tier === 'medium' ? 'bg-yellow-400' : 'bg-red-400';

  const delta    = story.delta ?? 0;
  const isUp     = delta > 0;
  const absDelta = Math.abs(delta);
  const srcCount = story.sources?.length ?? 0;

  // Show first 3 source names
  const visibleSources = (story.sources ?? []).slice(0, 3).map(s => s.name);
  const remainingSrc   = Math.max(0, srcCount - 3);

  return (
    <div
      dir={dir}
      className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-5 space-y-4 relative"
    >
      {/* Background glow — clipped separately so parent doesn't hide expanding text */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute top-0 start-0 w-40 h-40 bg-yellow-400/5 rounded-full blur-3xl" />
      </div>

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {lang === 'he' ? 'סיגנל היום' : "Today's Top Signal"}
        </span>
        <div className="flex items-center gap-2">
          {category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
              {category}
            </span>
          )}
          {story.isSignal && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 font-bold">
              ⚡ Signal
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-500">
            {story.lens === 'israel'
              ? (lang === 'he' ? '🇮🇱 ישראל' : '🇮🇱 Israel')
              : (lang === 'he' ? '🌍 עולם' : '🌍 World')}
          </span>
        </div>
      </div>

      {/* ── Headline ── */}
      <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
        {headline}
      </h2>

      {/* ── Summary ── */}
      {summary && (
        <div className="space-y-1">
          <div
            style={{
              maxHeight: summaryExpanded ? '600px' : '92px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}
          >
            <p className="text-sm text-gray-300 leading-relaxed">
              {summary}
            </p>
          </div>
          <button
            onClick={() => setSummaryExpanded(e => !e)}
            className="text-[11px] text-yellow-400/70 hover:text-yellow-400 transition-colors"
          >
            {summaryExpanded
              ? (lang === 'he' ? '▲ פחות' : '▲ less')
              : (lang === 'he' ? '▼ קרא עוד' : '▼ read more')}
          </button>
        </div>
      )}

      {/* ── Why it matters (from API) ── */}
      {why && (
        <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 px-4 py-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {lang === 'he' ? '🎯 למה זה חשוב?' : '🎯 Why it matters'}
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">
            {why}
          </p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Likelihood */}
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-black ${likelihoodColor}`}>
            {story.likelihood}%
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500 leading-none">
              {lang === 'he' ? 'סבירות' : 'likelihood'}
            </span>
            {absDelta > 0 && (
              <span className={`text-xs font-bold leading-none ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'} {absDelta}%
              </span>
            )}
          </div>
        </div>

        <div className="h-10 w-px bg-gray-800" />

        {/* Sources */}
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold text-white">{srcCount}</span>
          <span className="text-[10px] text-gray-500">
            {lang === 'he' ? 'מקורות' : 'sources'}
          </span>
        </div>

        <div className="h-10 w-px bg-gray-800" />

        {/* Confidence */}
        <div className="flex flex-col gap-0.5">
          <span className={`text-sm font-bold ${likelihoodColor}`}>
            {tier === 'high'
              ? (lang === 'he' ? 'גבוהה' : 'High')
              : tier === 'medium'
                ? (lang === 'he' ? 'בינונית' : 'Medium')
                : (lang === 'he' ? 'נמוכה' : 'Low')}
          </span>
          <span className="text-[10px] text-gray-500">
            {lang === 'he' ? 'ביטחון' : 'confidence'}
          </span>
        </div>
      </div>

      {/* ── Likelihood bar ── */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${story.likelihood}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-gray-700">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── Source list ── */}
      {visibleSources.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-600">
            {lang === 'he' ? 'מקורות:' : 'Sources:'}
          </span>
          {visibleSources.map(name => (
            <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
              {name}
            </span>
          ))}
          {remainingSrc > 0 && (
            <span className="text-[10px] text-gray-600">
              {lang === 'he' ? `+${remainingSrc} נוספים` : `+${remainingSrc} more`}
            </span>
          )}
        </div>
      )}

      {/* ── Intelligence Assessment (collapsible) ── */}
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 hover:text-gray-300 transition-colors w-full text-start"
        >
          <span className="text-yellow-400/70">📡</span>
          <span>{lang === 'he' ? 'הערכת מודיעין' : 'Intelligence Assessment'}</span>
          <span className="ms-auto text-gray-700">{expanded ? '▲' : '▼'}</span>
        </button>
        {expanded && (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {assessment}
          </p>
        )}
      </div>
    </div>
  );
}
