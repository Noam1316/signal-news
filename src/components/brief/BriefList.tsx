'use client';

import { stories } from '@/data/stories';
import BriefCard from './BriefCard';

export default function BriefList() {
  return (
    <div className="flex flex-col gap-4">
      {stories.map((story, i) => (
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
