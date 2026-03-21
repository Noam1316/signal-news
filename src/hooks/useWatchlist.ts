'use client';

import { useState, useCallback, useEffect } from 'react';

const KEY = 'signal_watchlist';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function save(s: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* silent */ }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => { setWatchlist(load()); }, []);

  const toggle = useCallback((slug: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      save(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((slug: string) => watchlist.has(slug), [watchlist]);

  return { watchlist, toggle, isWatched };
}
