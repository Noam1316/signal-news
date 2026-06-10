'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { SocialData, RedditPost, TrendItem, StoryBuzz } from '@/app/api/social/route';
import type { BriefStory } from '@/lib/types';

const SUBREDDIT_COLORS: Record<string, string> = {
  worldnews:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  geopolitics: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  israel:      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  middleeast:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

function timeAgo(utc: number, isHe: boolean): string {
  const diff = (Date.now() / 1000) - utc;
  if (diff < 3600) return isHe ? `${Math.floor(diff / 60)}ד` : `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return isHe ? `${Math.floor(diff / 3600)}ש` : `${Math.floor(diff / 3600)}h`;
  return isHe ? `${Math.floor(diff / 86400)}י` : `${Math.floor(diff / 86400)}d`;
}

function fmtScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PostRow({ post, isHe }: { post: RedditPost; isHe: boolean }) {
  const subColor = SUBREDDIT_COLORS[post.subreddit.toLowerCase()] ?? 'bg-gray-700/30 text-gray-400 border-gray-600/30';
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all group"
    >
      {/* Score */}
      <div className="shrink-0 flex flex-col items-center min-w-[42px]">
        <span className="text-sm font-bold text-orange-400">▲</span>
        <span className="text-xs font-semibold text-gray-300">{fmtScore(post.score)}</span>
        <span className="text-[10px] text-gray-600">{fmtScore(post.num_comments)}💬</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-gray-200 group-hover:text-white leading-snug line-clamp-2 transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${subColor}`}>
            r/{post.subreddit}
          </span>
          {post.matchedStorySlug && (
            <span className="text-[10px] text-emerald-400/70">⚡ {isHe ? 'מקושר לסיפור' : 'linked to story'}</span>
          )}
          <span className="text-[10px] text-gray-600 ms-auto">{timeAgo(post.created_utc, isHe)}</span>
        </div>
      </div>
    </a>
  );
}

function TrendChip({ trend }: { trend: TrendItem }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
      <span className="text-sm text-gray-200 truncate">{trend.title}</span>
      {trend.traffic && (
        <span className="shrink-0 ms-2 text-[11px] font-semibold text-green-400">{trend.traffic}</span>
      )}
    </div>
  );
}

function BuzzBar({ buzz, isHe }: { buzz: StoryBuzz; isHe: boolean }) {
  const post = buzz.topPost;
  if (!post) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="shrink-0 text-center">
        <div className="text-lg font-bold text-orange-400">{fmtScore(buzz.totalScore)}</div>
        <div className="text-[10px] text-gray-500">{buzz.postCount} {isHe ? 'פוסטים' : 'posts'}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 line-clamp-2 leading-snug">{post.title}</p>
        <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium ${SUBREDDIT_COLORS[post.subreddit.toLowerCase()] ?? 'bg-gray-700/30 text-gray-400 border-gray-600/30'}`}>
          r/{post.subreddit}
        </span>
      </div>
    </div>
  );
}

// ── Tabs inside SocialBuzz ────────────────────────────────────────────────────

type InnerTab = 'posts' | 'buzz' | 'trends' | 'indie';

interface IndieArticle {
  id: string; sourceName: string; lensCategory: string;
  title: string; description: string; link: string; pubDate: string;
}

function timeAgoStr(dateStr: string, isHe: boolean): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return isHe ? `${Math.floor(diff / 60)}ד` : `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return isHe ? `${Math.floor(diff / 3600)}ש` : `${Math.floor(diff / 3600)}h`;
  return isHe ? `${Math.floor(diff / 86400)}י` : `${Math.floor(diff / 86400)}d`;
}

// ─── Framing category labels ─────────────────────────────────────────────────

const FRAMING_META: Record<string, { he: string; en: string; color: string }> = {
  assertive:     { he: 'סמכותי', en: 'Assertive',     color: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  skeptical:     { he: 'ספקני',  en: 'Skeptical',     color: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  alarming:      { he: 'מדאיג',  en: 'Alarming',      color: 'bg-red-500/15 border-red-500/30 text-red-300' },
  investigative: { he: 'חוקר',   en: 'Investigative', color: 'bg-violet-500/15 border-violet-500/30 text-violet-300' },
  editorial:     { he: 'דעתי',   en: 'Editorial',     color: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
};

const SENTIMENT_META: Record<string, { icon: string; color: string }> = {
  negative: { icon: '🔴', color: 'text-red-400' },
  positive: { icon: '🟢', color: 'text-emerald-400' },
  neutral:  { icon: '⚪', color: 'text-gray-400' },
};

/** Divergence score bar */
function DivergenceBar({ score, isHe }: { score: number; isHe: boolean }) {
  const color = score >= 60 ? 'bg-red-400' : score >= 35 ? 'bg-amber-400' : 'bg-emerald-400';
  const label = score >= 60
    ? (isHe ? 'פיצול גבוה' : 'High divergence')
    : score >= 35
    ? (isHe ? 'פיצול בינוני' : 'Moderate divergence')
    : (isHe ? 'כיסוי דומה' : 'Similar coverage');
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-[10px] font-mono text-gray-500 tabular-nums">{score}%</span>
    </div>
  );
}

/** Single story narrative card — indie vs mainstream */
function NarrativeCard({ story, isHe }: { story: BriefStory; isHe: boolean }) {
  const [open, setOpen] = useState(false);
  const ivm = story.indieVsMainstream!;
  const headline = isHe ? story.headline.he : story.headline.en;

  const indieSent  = SENTIMENT_META[ivm.indieSentiment]  ?? SENTIMENT_META.neutral;
  const msSent     = SENTIMENT_META[ivm.mainstreamSentiment] ?? SENTIMENT_META.neutral;

  return (
    <div
      className="rounded-xl border border-orange-500/15 bg-orange-500/[0.03] overflow-hidden cursor-pointer"
      onClick={() => setOpen(p => !p)}
    >
      {/* Header row */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-200 leading-snug line-clamp-1">{headline}</p>
          {/* Divergence note */}
          {ivm.divergenceNote && (
            <p className="text-[11px] text-orange-400/80 mt-0.5">{ivm.divergenceNote}</p>
          )}
        </div>
        {/* Divergence score badge */}
        <div className={`shrink-0 px-2 py-1 rounded-lg border text-center ${
          ivm.divergenceScore >= 60 ? 'bg-red-500/10 border-red-500/25 text-red-400' :
          ivm.divergenceScore >= 35 ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
          'bg-gray-800 border-gray-700 text-gray-400'
        }`}>
          <div className="text-sm font-bold tabular-nums">{ivm.divergenceScore}</div>
          <div className="text-[8px] uppercase tracking-wide">{isHe ? 'פיצול' : 'split'}</div>
        </div>
      </div>

      {/* Collapsed preview: sentiment comparison + framing chips */}
      {!open && (
        <div className="px-4 pb-3 space-y-2">
          {/* Sentiment comparison */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-gray-500">{isHe ? 'עצמאי:' : 'Indie:'}</span>
            <span className={`font-semibold ${indieSent.color}`}>{indieSent.icon} {isHe ? ({ positive: 'חיובי', negative: 'שלילי', neutral: 'נייטרלי' }[ivm.indieSentiment]) : ivm.indieSentiment}</span>
            <span className="text-gray-600 mx-1">|</span>
            <span className="text-gray-500">{isHe ? 'ממסד:' : 'Mainstream:'}</span>
            <span className={`font-semibold ${msSent.color}`}>{msSent.icon} {isHe ? ({ positive: 'חיובי', negative: 'שלילי', neutral: 'נייטרלי' }[ivm.mainstreamSentiment]) : ivm.mainstreamSentiment}</span>
          </div>
          {/* Top exclusive keyword chips */}
          <div className="flex flex-wrap gap-1">
            {ivm.indieExclusive.slice(0, 3).map((w, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border bg-orange-500/10 border-orange-500/25 text-orange-300">🟠 {w}</span>
            ))}
            {ivm.mainstreamExclusive.slice(0, 3).map((w, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/25 text-blue-300">🔵 {w}</span>
            ))}
          </div>
          <p className="text-[9px] text-gray-700">{isHe ? '▾ לחץ לניתוח מלא' : '▾ expand for full analysis'}</p>
        </div>
      )}

      {/* Expanded: full narrative analysis */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-orange-500/10 pt-3">
          {/* Divergence bar */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">{isHe ? 'מדד פיצול נרטיב' : 'Narrative Divergence'}</p>
            <DivergenceBar score={ivm.divergenceScore} isHe={isHe} />
          </div>

          {/* Side-by-side: indie | mainstream */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Indie side */}
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">🟠 {isHe ? 'תקשורת עצמאית' : 'Independent'}</span>
                <span className="text-[10px] text-gray-500">{ivm.indieCount} {isHe ? 'כתבות' : 'articles'}</span>
              </div>
              {/* Exclusive topics */}
              {ivm.indieExclusive.length > 0 && (
                <div>
                  <p className="text-[9px] text-orange-400/60 uppercase mb-1">{isHe ? 'נושאים בלעדיים' : 'Exclusive topics'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.indieExclusive.map((w, i) => (
                      <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-200">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Framing */}
              {ivm.framingIndie.length > 0 && (
                <div>
                  <p className="text-[9px] text-orange-400/60 uppercase mb-1">{isHe ? 'סגנון סיקור' : 'Framing style'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.framingIndie.map((f, i) => {
                      const meta = FRAMING_META[f.category] ?? { he: f.category, en: f.category, color: 'bg-gray-700 border-gray-600 text-gray-300' };
                      return (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${meta.color}`} title={f.word}>
                          {isHe ? meta.he : meta.en}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Entities */}
              {ivm.entitiesIndie.length > 0 && (
                <div>
                  <p className="text-[9px] text-orange-400/60 uppercase mb-1">{isHe ? 'ישויות בלעדיות' : 'Exclusive entities'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.entitiesIndie.map((e, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-300">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Sentiment */}
              <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-orange-500/10">
                <span className="text-gray-500">{isHe ? 'טון:' : 'Tone:'}</span>
                <span className={`font-semibold ${indieSent.color}`}>{indieSent.icon} {isHe ? ({ positive: 'חיובי', negative: 'שלילי', neutral: 'נייטרלי' }[ivm.indieSentiment]) : ivm.indieSentiment}</span>
              </div>
            </div>

            {/* Mainstream side */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">🔵 {isHe ? 'תקשורת ממסדית' : 'Mainstream'}</span>
                <span className="text-[10px] text-gray-500">{ivm.mainstreamCount} {isHe ? 'כתבות' : 'articles'}</span>
              </div>
              {/* Exclusive topics */}
              {ivm.mainstreamExclusive.length > 0 && (
                <div>
                  <p className="text-[9px] text-blue-400/60 uppercase mb-1">{isHe ? 'נושאים בלעדיים' : 'Exclusive topics'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.mainstreamExclusive.map((w, i) => (
                      <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-200">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Framing */}
              {ivm.framingMainstream.length > 0 && (
                <div>
                  <p className="text-[9px] text-blue-400/60 uppercase mb-1">{isHe ? 'סגנון סיקור' : 'Framing style'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.framingMainstream.map((f, i) => {
                      const meta = FRAMING_META[f.category] ?? { he: f.category, en: f.category, color: 'bg-gray-700 border-gray-600 text-gray-300' };
                      return (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${meta.color}`} title={f.word}>
                          {isHe ? meta.he : meta.en}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Entities */}
              {ivm.entitiesMainstream.length > 0 && (
                <div>
                  <p className="text-[9px] text-blue-400/60 uppercase mb-1">{isHe ? 'ישויות בלעדיות' : 'Exclusive entities'}</p>
                  <div className="flex flex-wrap gap-1">
                    {ivm.entitiesMainstream.map((e, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-300">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Sentiment */}
              <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-blue-500/10">
                <span className="text-gray-500">{isHe ? 'טון:' : 'Tone:'}</span>
                <span className={`font-semibold ${msSent.color}`}>{msSent.icon} {isHe ? ({ positive: 'חיובי', negative: 'שלילי', neutral: 'נייטרלי' }[ivm.mainstreamSentiment]) : ivm.mainstreamSentiment}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialBuzz() {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [innerTab, setInnerTab] = useState<InnerTab>('indie');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [indieArticles, setIndieArticles] = useState<IndieArticle[]>([]);
  const [indieLoading, setIndieLoading] = useState(false);
  const [narrativeStories, setNarrativeStories] = useState<BriefStory[]>([]);
  const [narrativeTab, setNarrativeTab] = useState<'analysis' | 'articles'>('analysis');

  useEffect(() => {
    fetch('/api/social')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (innerTab !== 'indie') return;
    setIndieLoading(true);
    // Fetch both indie articles and stories (for narrative analysis)
    Promise.all([
      fetch('/api/articles?lens=il-independent&limit=40').then(r => r.ok ? r.json() : { articles: [] }),
      fetch('/api/stories?limit=30').then(r => r.ok ? r.json() : { stories: [] }),
    ]).then(([articlesData, storiesData]) => {
      setIndieArticles(articlesData.articles ?? []);
      const withAnalysis = (storiesData.stories ?? []).filter((s: BriefStory) => s.indieVsMainstream);
      setNarrativeStories(withAnalysis);
    }).catch(() => {}).finally(() => setIndieLoading(false));
  }, [innerTab]);

  if (loading) {
    return (
      <div dir={dir} className="space-y-3 animate-pulse">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 flex-1 bg-gray-800 rounded-lg" />)}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-800/50 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.source === 'error') {
    return (
      <div dir={dir} className="text-center py-10 text-gray-500 text-sm">
        {isHe ? 'לא ניתן לטעון נתוני רשתות חברתיות' : 'Could not load social data'}
      </div>
    );
  }

  const subs = ['all', ...Array.from(new Set(data.posts.map(p => p.subreddit.toLowerCase())))];
  const visiblePosts = subFilter === 'all'
    ? data.posts
    : data.posts.filter(p => p.subreddit.toLowerCase() === subFilter);

  const INNER_TABS: { id: InnerTab; icon: string; he: string; en: string }[] = [
    { id: 'indie',  icon: '🟠', he: 'עצמאי', en: 'Independent' },
    { id: 'posts',  icon: '🔴', he: `Reddit (${data.posts.length})`,  en: `Reddit (${data.posts.length})` },
    { id: 'buzz',   icon: '🔥', he: `באז (${data.storyBuzz.length})`, en: `Buzz (${data.storyBuzz.length})` },
    { id: 'trends', icon: '📈', he: `טרנדים (${data.trends.length})`, en: `IL Trends (${data.trends.length})` },
  ];

  return (
    <div dir={dir} className="space-y-4">

      {/* Header + last update */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <h3 className="text-sm font-semibold text-gray-300">
            {isHe ? 'דופק הרשתות החברתיות' : 'Social Pulse'}
          </h3>
        </div>
        <span className="text-[10px] text-gray-600">
          {isHe ? 'Reddit · Google Trends' : 'Reddit · Google Trends'}{' '}
          · {new Date(data.fetchedAt).toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Inner tab bar */}
      <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 border border-gray-800">
        {INNER_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setInnerTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              innerTab === t.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{isHe ? t.he : t.en}</span>
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {innerTab === 'posts' && (
        <div className="space-y-3">
          {/* Subreddit filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {subs.map(s => (
              <button
                key={s}
                onClick={() => setSubFilter(s)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  subFilter === s
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                    : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                {s === 'all' ? (isHe ? 'הכל' : 'All') : `r/${s}`}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
            {visiblePosts.slice(0, 40).map(p => (
              <PostRow key={p.id} post={p} isHe={isHe} />
            ))}
            {visiblePosts.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-6">
                {isHe ? 'אין פוסטים בסאברדיט זה' : 'No posts in this subreddit'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Buzz tab */}
      {innerTab === 'buzz' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {isHe
              ? 'סיפורים שנדונים הכי הרבה ב-Reddit לפי keyword matching'
              : 'Stories generating the most Reddit discussion, matched by keywords'}
          </p>
          {data.storyBuzz.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              {isHe ? 'אין סיפורים עם באז כרגע' : 'No story buzz detected yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {data.storyBuzz.slice(0, 15).map((buzz, i) => (
                <div key={buzz.slug} className="flex items-start gap-2">
                  <span className="shrink-0 mt-2.5 text-[11px] font-mono text-gray-600 w-5 text-end">{i + 1}.</span>
                  <div className="flex-1">
                    <BuzzBar buzz={buzz} isHe={isHe} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Independent media tab */}
      {innerTab === 'indie' && (
        <div className="space-y-3">
          {/* Sub-tabs: analysis vs raw articles */}
          <div className="flex gap-1 bg-gray-900/40 rounded-lg p-1 border border-gray-800">
            <button
              onClick={() => setNarrativeTab('analysis')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                narrativeTab === 'analysis' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isHe ? '🔍 ניתוח נרטיב' : '🔍 Narrative Analysis'}
              {narrativeStories.length > 0 && (
                <span className="ms-1.5 text-[10px] px-1 rounded-full bg-orange-500/20 text-orange-400">
                  {narrativeStories.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setNarrativeTab('articles')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                narrativeTab === 'articles' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isHe ? `📰 כתבות (${indieArticles.length})` : `📰 Articles (${indieArticles.length})`}
            </button>
          </div>

          {indieLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-800/50 rounded-lg" />)}
            </div>
          ) : narrativeTab === 'analysis' ? (
            /* ── Narrative analysis view ── */
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {isHe
                  ? 'ניתוח טקסטואלי: מה עצמאי מכסה בלי הממסד, ואיך כל צד מסגר את אותו הסיפור'
                  : 'Text analysis: exclusive topics, framing differences and entity divergence per story'}
              </p>
              {narrativeStories.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-sm text-gray-500">
                    {isHe ? 'אין סיפורים עם כיסוי משני הצדדים כרגע' : 'No stories with both indie and mainstream coverage yet'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {isHe ? 'הניתוח מופיע כשסיפור מכוסה גם בעצמאי וגם בממסד' : 'Analysis appears when a story is covered by both sides'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pe-1">
                  {/* Sort by divergence score — most divergent first */}
                  {[...narrativeStories]
                    .sort((a, b) => (b.indieVsMainstream?.divergenceScore ?? 0) - (a.indieVsMainstream?.divergenceScore ?? 0))
                    .map(story => (
                      <NarrativeCard key={story.slug} story={story} isHe={isHe} />
                    ))
                  }
                </div>
              )}
            </div>
          ) : (
            /* ── Raw articles view ── */
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {isHe
                  ? 'כתבות אחרונות מתקשורת עצמאית — 972, סיכה מקומית, העין השביעית ועוד'
                  : 'Latest from independent Israeli media — +972, Local Call, The Seventh Eye and more'}
              </p>
              {indieArticles.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">
                  {isHe ? 'אין כתבות עצמאיות כרגע' : 'No independent articles yet'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
                  {indieArticles.map(a => (
                    <a
                      key={a.id}
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/[0.04] hover:bg-orange-500/[0.08] border border-orange-500/10 hover:border-orange-500/20 transition-all group"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm text-gray-200 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                          {a.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-orange-500/15 border-orange-500/30 text-orange-400">
                            🟠 {a.sourceName}
                          </span>
                          {a.pubDate && (
                            <span className="text-[10px] text-gray-600 ms-auto">
                              {timeAgoStr(a.pubDate, isHe)}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trends tab */}
      {innerTab === 'trends' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {isHe ? 'מה מחפשים הכי הרבה בישראל היום — Google Trends' : 'Top searches in Israel today — Google Trends'}
          </p>
          {data.trends.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              {isHe ? 'לא ניתן לטעון טרנדים' : 'Could not load trends'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.trends.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 text-[11px] font-mono text-gray-600 w-5 text-end">{i + 1}.</span>
                  <div className="flex-1">
                    <TrendChip trend={t} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
