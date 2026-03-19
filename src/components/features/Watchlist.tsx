'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  SUGGESTED_TOPICS, SUGGESTED_ENTITIES, WatchlistItem,
} from '@/services/watchlist';

const TYPE_ICONS = { topic: '📌', entity: '👤', source: '📰' };
const TYPE_COLORS = {
  topic: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  entity: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  source: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
};

export default function Watchlist() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => { setItems(getWatchlist()); }, []);

  const handleAdd = (item: { id: string; name: string; type: 'topic' | 'entity' | 'source' }) => {
    setItems(addToWatchlist(item));
  };

  const handleRemove = (id: string) => {
    setItems(removeFromWatchlist(id));
  };

  return (
    <div className="space-y-4">
      {/* Current watchlist */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            ⭐ {lang === 'he' ? 'רשימת מעקב' : 'My Watchlist'}
            <span className="text-gray-500 ms-2 font-normal">({items.length})</span>
          </h3>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-yellow-400 hover:text-yellow-300"
          >
            + {lang === 'he' ? 'הוסף' : 'Add'}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            {lang === 'he' ? 'הרשימה ריקה — הוסף נושאים או ישויות למעקב' : 'Empty — add topics or entities to watch'}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 group">
                <span className="text-sm">{TYPE_ICONS[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {lang === 'he' ? 'נוסף: ' : 'Added: '}
                    {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[item.type]}`}>
                  {item.type}
                </span>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase">
            📌 {lang === 'he' ? 'נושאים מומלצים' : 'Suggested Topics'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map(t => {
              const isAdded = items.some(i => i.id === t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => !isAdded && handleAdd(t)}
                  disabled={isAdded}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    isAdded
                      ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20 cursor-default'
                      : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-yellow-400 hover:border-yellow-400/30'
                  }`}
                >
                  {isAdded ? '✓ ' : '+ '}{t.name}
                </button>
              );
            })}
          </div>

          <h4 className="text-xs font-semibold text-gray-400 uppercase mt-4">
            👤 {lang === 'he' ? 'ישויות מומלצות' : 'Suggested Entities'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_ENTITIES.map(e => {
              const isAdded = items.some(i => i.id === e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => !isAdded && handleAdd(e)}
                  disabled={isAdded}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    isAdded
                      ? 'bg-blue-400/10 text-blue-400 border-blue-400/20 cursor-default'
                      : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-blue-400 hover:border-blue-400/30'
                  }`}
                >
                  {isAdded ? '✓ ' : '+ '}{e.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
