'use client';

import { useState } from 'react';
import { stories } from '@/data/stories';
import BriefCard from './BriefCard';
import LensSwitcher from '@/components/shared/LensSwitcher';

export default function BriefList() {
  const [lens, setLens] = useState<'all' | 'israel' | 'world'>('all');

  const filtered = lens === 'all'
    ? stories
    : stories.filter((s) => s.lens === lens);

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <LensSwitcher value={lens} onChange={setLens} />
      </div>
      {filtered.map((story, i) => (
        <div
          key={story.slug}
          className="animate-slide-up"
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
        >
          <BriefCard story={story} />
        </div>
      ))}
    </div>
  );
}
