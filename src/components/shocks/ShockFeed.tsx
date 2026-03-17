'use client';

import { useLanguage } from '@/i18n/context';
import { shocks } from '@/data/shocks';
import ShockCard from '@/components/shocks/ShockCard';

export default function ShockFeed() {
  const { ui, dir } = useLanguage();

  const sorted = [...shocks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <section dir={dir} className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{ui('shockFeed')}</h1>
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
