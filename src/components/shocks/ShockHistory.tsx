'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockLogEntry } from '@/services/shock-log';

const TYPE_CONFIG: Record<string, { color: string; bg: string; he: string; en: string }> = {
  likelihood:    { color: '#f97316', bg: 'bg-orange-500', he: 'סבירות',    en: 'Likelihood' },
  narrative:     { color: '#a855f7', bg: 'bg-purple-500', he: 'נרטיב',     en: 'Narrative' },
  fragmentation: { color: '#14b8a6', bg: 'bg-teal-500',   he: 'פיצול',     en: 'Fragmentation' },
};

export default function ShockHistory() {
  const { lang, dir } = useLanguage();
  const [log, setLog] = useState<ShockLogEntry[]>([]);
  const [accuracy, setAccuracy] = useState<{ total: number; resolved: number; correct: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/shock-log')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setLog(data.log || []);
          setAccuracy(data.accuracy);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || log.length === 0) return null;

  // Show last 20 shocks, newest first
  const recent = log.slice(0, 20);
  const maxDelta = Math.max(...recent.map(e => Math.abs(e.delta)), 1);

  return (
    <div dir={dir} className="rounded-xl bg-gray-900/60 border border-gray-800 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {lang === 'he' ? 'היסטוריית זעזועים' : 'Shock History'}
          </span>
          <span className="text-[10px] font-mono text-gray-600">{log.length}</span>
        </div>
        <div className="flex items-center gap-3">
          {accuracy && accuracy.total > 0 && (
            <span className="text-[10px] text-emerald-400">
              {lang === 'he' ? `${accuracy.total} זוהו` : `${accuracy.total} logged`}
            </span>
          )}
          {/* Mini inline bar preview */}
          <div dir="ltr" className="flex items-end gap-0.5 h-4">
            {recent.slice(0, 10).reverse().map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.shockType] ?? TYPE_CONFIG.likelihood;
              const heightPct = Math.max(20, Math.round((Math.abs(entry.delta) / maxDelta) * 100));
              return (
                <div
                  key={`${entry.id}-${i}`}
                  className={`${cfg.bg} rounded-sm opacity-70 w-1.5`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
          <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expandable full chart */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800">
          {/* Bar chart */}
          <div dir="ltr" className="flex items-end gap-1 h-14 pt-2">
            {recent.reverse().map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.shockType] ?? TYPE_CONFIG.likelihood;
              const heightPct = Math.max(12, Math.round((Math.abs(entry.delta) / maxDelta) * 100));
              const date = new Date(entry.timestamp).toLocaleDateString(
                lang === 'he' ? 'he-IL' : 'en-US',
                { day: 'numeric', month: 'short' }
              );
              return (
                <div
                  key={`${entry.id}-bar-${i}`}
                  title={`${entry.headline}\n${entry.delta > 0 ? '+' : ''}${entry.delta}% · ${date}`}
                  className={`${cfg.bg} rounded-sm opacity-75 hover:opacity-100 transition-opacity flex-1 cursor-default`}
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>

          {/* Last shock headline */}
          {recent[recent.length - 1] && (
            <p className="text-[10px] text-gray-500 truncate">
              {lang === 'he' ? 'אחרון:' : 'Latest:'}{' '}
              <span className="text-gray-400">{recent[recent.length - 1].headline}</span>
            </p>
          )}

          {/* Legend */}
          <div className="flex gap-4">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                <span className="text-[9px] text-gray-500">{lang === 'he' ? cfg.he : cfg.en}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
