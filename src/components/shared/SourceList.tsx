'use client';

import { Source } from '@/lib/types';

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {sources.map((source, index) => (
        <span
          key={`${source.name}-${index}`}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-gray-300 border border-gray-700 bg-gray-800/50"
        >
          {source.name}
        </span>
      ))}
    </div>
  );
}
