'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import BriefCard from './BriefCard';
import LensSwitcher from '@/components/shared/LensSwitcher';

export default function BriefList() {
  const { lang } = useLanguage();
  const [lens, setLens] = useState<'all' | 'israel' | 'world'>('all');
  const [stories, setStories] = useState<BriefStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStories(data.stories || []);
      setSource(data.source || '');
    } catch {
      // Fallback: import static stories
      const { stories: staticStories } = await import('@/data/stories');
      setStories(staticStories);
      setSource('static-import');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filtered = lens === 'all'
    ? stories
    : stories.filter((s) => s.lens === lens);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <LensSwitcher value={lens} onChange={setLens} />
        <div className="flex items-center gap-2">
          {source && source !== 'static-import' && source !== 'static-fallback' && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {lang === 'he' ? 'חי מ-RSS' : 'Live from RSS'}
            </span>
          )}
          {(source === 'static-import' || source === 'static-fallback') && (
            <span className="text-[10px] text-gray-600">
              {lang === 'he' ? 'נתוני דמו' : 'Demo data'}
            </span>
          )}
        </div>
      </div>

      {loading && stories.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 space-y-3 animate-pulse">
              <div className="h-3 w-24 bg-gray-800 rounded" />
              <div className="h-5 w-3/4 bg-gray-800 rounded" />
              <div className="h-3 w-full bg-gray-800 rounded" />
              <div className="h-2 w-1/2 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {filtered.map((story, i) => (
        <div
          key={story.slug}
          className="animate-slide-up"
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
        >
          <BriefCard story={story} />
        </div>
      ))}

      {!loading && filtered.length === 0 && stories.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          {lang === 'he' ? 'אין סיפורים בעדשה הזו' : 'No stories in this lens'}
        </div>
      )}
    </div>
  );
}
