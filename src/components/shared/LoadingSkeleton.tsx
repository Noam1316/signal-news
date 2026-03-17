'use client';

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-5 w-16" />
      </div>
      <div className="skeleton h-6 w-3/4" />
      <div className="space-y-1.5">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="border-s-2 border-gray-800 ps-4 py-3 space-y-2">
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-2">
        <div className="skeleton h-4 w-16 rounded-full" />
        <div className="skeleton h-4 w-12" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleSkeleton key={i} />
      ))}
    </div>
  );
}
