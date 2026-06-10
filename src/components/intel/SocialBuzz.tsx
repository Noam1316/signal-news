'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { SocialData, RedditPost, TrendItem, StoryBuzz } from '@/app/api/social/route';

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

type InnerTab = 'posts' | 'buzz' | 'trends';

export default function SocialBuzz() {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [innerTab, setInnerTab] = useState<InnerTab>('posts');
  const [subFilter, setSubFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/social')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    { id: 'posts',  icon: '🔴', he: `פוסטים (${data.posts.length})`,  en: `Posts (${data.posts.length})` },
    { id: 'buzz',   icon: '🔥', he: `באז לסיפורים (${data.storyBuzz.length})`, en: `Story Buzz (${data.storyBuzz.length})` },
    { id: 'trends', icon: '📈', he: `טרנדים ישראל (${data.trends.length})`, en: `IL Trends (${data.trends.length})` },
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
