'use client';

import { useEffect, useState, use } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import BriefCard from '@/components/brief/BriefCard';
import { useWatchlist } from '@/hooks/useWatchlist';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TopicPage({ params }: PageProps) {
  const { slug } = use(params);
  const topicName = decodeURIComponent(slug);
  const { lang, dir } = useLanguage();
  const [stories, setStories] = useState<BriefStory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggle, isWatched } = useWatchlist();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        const all: BriefStory[] = data.stories || [];
        const filtered = all.filter(s =>
          s.category.he === topicName ||
          s.category.en === topicName ||
          s.category.he.toLowerCase().includes(topicName.toLowerCase()) ||
          s.category.en.toLowerCase().includes(topicName.toLowerCase())
        );
        setStories(filtered);
      } catch {
        setStories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topicName]);

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gray-950 text-gray-100"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {lang === 'he' ? '← חזרה ל-Dashboard' : '← Back to Dashboard'}
        </Link>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-yellow-400/70 font-semibold">
              {lang === 'he' ? 'נושא' : 'Topic'}
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{topicName}</h1>
          {!loading && (
            <p className="text-sm text-gray-500">
              {stories.length > 0
                ? (lang === 'he' ? `${stories.length} סיפורים פעילים` : `${stories.length} active stories`)
                : (lang === 'he' ? 'אין סיפורים כרגע' : 'No stories at the moment')}
            </p>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-6 space-y-3 animate-pulse">
                <div className="h-3 w-20 bg-gray-800 rounded" />
                <div className="h-5 w-3/4 bg-gray-800 rounded" />
                <div className="h-3 w-full bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Stories */}
        {!loading && stories.length > 0 && (
          <div className="space-y-4">
            {stories.map(story => (
              <BriefCard
                key={story.slug}
                story={story}
                isWatched={isWatched(story.slug)}
                onWatchToggle={() => toggle(story.slug)}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && stories.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">🔭</div>
            <p className="text-sm text-gray-400">
              {lang === 'he' ? `אין סיפורים פעילים על "${topicName}"` : `No active stories about "${topicName}"`}
            </p>
            <Link href="/dashboard" className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
              {lang === 'he' ? 'חזרה לדשבורד' : 'Back to Dashboard'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
