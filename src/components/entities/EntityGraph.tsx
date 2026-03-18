'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

interface Entity {
  entity: { he: string; en: string; type: string };
  count: number;
  articles: string[];
}

interface CoOccurrence {
  entity1: string;
  entity2: string;
  sharedArticles: number;
}

interface EntitiesData {
  entities: Entity[];
  cooccurrence: CoOccurrence[];
  totalArticles: number;
  analyzedAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  person: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  org: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  country: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const TYPE_ICONS: Record<string, string> = {
  person: '👤',
  org: '🏛️',
  country: '🌍',
};

const TYPE_LABELS: Record<string, { he: string; en: string }> = {
  person: { he: 'אישים', en: 'People' },
  org: { he: 'ארגונים', en: 'Organizations' },
  country: { he: 'מדינות', en: 'Countries' },
};

export default function EntityGraph() {
  const { lang, dir } = useLanguage();
  const [data, setData] = useState<EntitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | 'all'>('all');

  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/entities');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchEntities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-gray-900/80 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.entities.length === 0) return null;

  const filteredEntities = filterType === 'all'
    ? data.entities
    : data.entities.filter((e) => e.entity.type === filterType);

  // Get connections for selected entity
  const connections = selectedEntity
    ? data.cooccurrence.filter((c) => c.entity1 === selectedEntity || c.entity2 === selectedEntity)
    : [];
  const connectedNames = new Set(
    connections.flatMap((c) => [c.entity1, c.entity2]).filter((n) => n !== selectedEntity)
  );

  // Max count for sizing
  const maxCount = Math.max(...data.entities.map((e) => e.count));

  return (
    <section dir={dir} className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🕸️</span>
          {lang === 'he' ? 'גרף ישויות — מי מופיע בחדשות' : 'Entity Graph — Who\'s in the News'}
        </h2>
        <p className="text-sm text-gray-400">
          {lang === 'he'
            ? `ניתוח ${data.totalArticles} כתבות — לחץ על ישות כדי לראות קשרים`
            : `Analysis of ${data.totalArticles} articles — click an entity to see connections`}
        </p>
      </header>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setFilterType('all'); setSelectedEntity(null); }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterType === 'all' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
          }`}
        >
          {lang === 'he' ? 'הכל' : 'All'} ({data.entities.length})
        </button>
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const count = data.entities.filter((e) => e.entity.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => { setFilterType(type); setSelectedEntity(null); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === type ? TYPE_COLORS[type] + ' border' : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {TYPE_ICONS[type]} {lang === 'he' ? label.he : label.en} ({count})
            </button>
          );
        })}
      </div>

      {/* Entity bubbles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredEntities.slice(0, 20).map((e) => {
          const isSelected = selectedEntity === e.entity.en;
          const isConnected = connectedNames.has(e.entity.en);
          const sizeFactor = e.count / maxCount;
          const fontSize = sizeFactor > 0.7 ? 'text-base font-bold' : sizeFactor > 0.4 ? 'text-sm font-semibold' : 'text-sm';

          return (
            <button
              key={e.entity.en}
              onClick={() => setSelectedEntity(isSelected ? null : e.entity.en)}
              className={`rounded-lg border p-3 text-start transition-all ${
                isSelected
                  ? 'bg-yellow-500/10 border-yellow-500/50 ring-1 ring-yellow-500/30'
                  : isConnected
                  ? 'bg-blue-500/10 border-blue-500/40'
                  : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{TYPE_ICONS[e.entity.type] || '📌'}</span>
                <span className={fontSize}>{lang === 'he' ? e.entity.he : e.entity.en}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {e.count} {lang === 'he' ? 'כתבות' : 'articles'}
                </span>
                {/* Visual bar */}
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      isSelected ? 'bg-yellow-500' : isConnected ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                    style={{ width: `${Math.max(10, sizeFactor * 100)}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Connection panel */}
      {selectedEntity && connections.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-yellow-400">
            {lang === 'he'
              ? `🔗 קשרי ${selectedEntity} (מופיעים יחד בכתבות)`
              : `🔗 ${selectedEntity} connections (co-appearing in articles)`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {connections.map((c) => {
              const otherName = c.entity1 === selectedEntity ? c.entity2 : c.entity1;
              return (
                <button
                  key={`${c.entity1}-${c.entity2}`}
                  onClick={() => setSelectedEntity(otherName)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  {otherName}
                  <span className="ms-1.5 text-xs text-blue-400/70">{c.sharedArticles}×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top co-occurrences table */}
      {!selectedEntity && data.cooccurrence.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            {lang === 'he' ? '🔗 קשרים חזקים — מופיעים יחד הכי הרבה' : '🔗 Strongest Connections — Most Co-occurring'}
          </h3>
          <div className="space-y-2">
            {data.cooccurrence.slice(0, 8).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEntity(c.entity1)}
                    className="text-blue-400 hover:underline"
                  >
                    {c.entity1}
                  </button>
                  <span className="text-gray-600">↔</span>
                  <button
                    onClick={() => setSelectedEntity(c.entity2)}
                    className="text-blue-400 hover:underline"
                  >
                    {c.entity2}
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {c.sharedArticles} {lang === 'he' ? 'כתבות משותפות' : 'shared articles'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
