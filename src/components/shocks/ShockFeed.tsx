'use client';

import { useLanguage } from '@/i18n/context';
import { shocks } from '@/data/shocks';
import ShockCard from '@/components/shocks/ShockCard';

export default function ShockFeed() {
  const { ui, dir } = useLanguage();

  const sorted = [...shocks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const highConfidenceCount = shocks.filter((s) => s.confidence === 'high').length;

  return (
    <section dir={dir} className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ui('shockFeed')}</h1>
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {highConfidenceCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {highConfidenceCount}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400">
          {dir === 'rtl'
            ? 'שינויים פתאומיים בסבירות, נרטיב או פיצול תקשורתי'
            : 'Sudden shifts in likelihood, narrative, or media fragmentation'}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {sorted.map((shock) => (
          <ShockCard key={shock.id} shock={shock} />
        ))}
      </div>
    </section>
  );
}
