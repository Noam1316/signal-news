'use client';

interface SourceBarProps {
  lensCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  total: number;
  lang: string;
}

const LENS_META: Record<string, { color: string; bg: string; label: { en: string; he: string } }> = {
  'il-mainstream': {
    color: 'bg-blue-500',
    bg: 'text-blue-400',
    label: { en: 'IL Mainstream', he: 'מיינסטרים' },
  },
  'il-partisan': {
    color: 'bg-purple-500',
    bg: 'text-purple-400',
    label: { en: 'IL Partisan', he: 'מפלגתי' },
  },
  international: {
    color: 'bg-emerald-500',
    bg: 'text-emerald-400',
    label: { en: 'International', he: 'בינלאומי' },
  },
};

export default function SourceBar({ lensCounts, sourceCounts, total, lang }: SourceBarProps) {
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="rounded-xl bg-gray-900/60 border border-gray-800/50 p-4 space-y-4">
      {/* Distribution bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{lang === 'he' ? 'חלוקה לפי עדשה' : 'Distribution by lens'}</span>
          <span className="font-mono">{total}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-800 gap-px">
          {Object.entries(LENS_META).map(([key, meta]) => {
            const count = lensCounts[key] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className={`${meta.color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${meta.label[lang === 'he' ? 'he' : 'en']}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex gap-4 text-[10px]">
          {Object.entries(LENS_META).map(([key, meta]) => {
            const count = lensCounts[key] || 0;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${meta.color}`} />
                <span className="text-gray-400">
                  {meta.label[lang === 'he' ? 'he' : 'en']}
                </span>
                <span className={`font-mono font-semibold ${meta.bg}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top sources */}
      <div className="space-y-2">
        <span className="text-xs text-gray-500">
          {lang === 'he' ? 'מקורות מובילים' : 'Top sources'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {topSources.map(([name, count]) => (
            <span
              key={name}
              className="text-[10px] px-2 py-1 rounded-md bg-gray-800 border border-gray-700/50 text-gray-300 flex items-center gap-1.5"
            >
              {name}
              <span className="font-mono text-yellow-400/80 font-semibold">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
