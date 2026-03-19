/**
 * Personal Watchlist Service
 * localStorage-based topic/entity following with alerts
 */

export interface WatchlistItem {
  id: string;
  type: 'topic' | 'entity' | 'source';
  name: string;
  addedAt: string;
  lastAlertAt?: string;
  alertCount: number;
  notes?: string;
}

const STORAGE_KEY = 'signal-news-watchlist';

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt' | 'alertCount'>): WatchlistItem[] {
  const list = getWatchlist();
  if (list.some(w => w.id === item.id)) return list;
  const newItem: WatchlistItem = { ...item, addedAt: new Date().toISOString(), alertCount: 0 };
  const updated = [newItem, ...list];
  saveWatchlist(updated);
  return updated;
}

export function removeFromWatchlist(id: string): WatchlistItem[] {
  const list = getWatchlist().filter(w => w.id !== id);
  saveWatchlist(list);
  return list;
}

export function isWatched(id: string): boolean {
  return getWatchlist().some(w => w.id === id);
}

export const SUGGESTED_TOPICS = [
  { id: 'iran-nuclear', name: 'Iran Nuclear', type: 'topic' as const },
  { id: 'gaza-conflict', name: 'Gaza Conflict', type: 'topic' as const },
  { id: 'ukraine-war', name: 'Ukraine War', type: 'topic' as const },
  { id: 'us-election', name: 'US Election', type: 'topic' as const },
  { id: 'saudi-normalization', name: 'Saudi Normalization', type: 'topic' as const },
  { id: 'ai-regulation', name: 'AI Regulation', type: 'topic' as const },
  { id: 'oil-markets', name: 'Oil Markets', type: 'topic' as const },
  { id: 'china-taiwan', name: 'China-Taiwan', type: 'topic' as const },
];

export const SUGGESTED_ENTITIES = [
  { id: 'netanyahu', name: 'Benjamin Netanyahu', type: 'entity' as const },
  { id: 'biden', name: 'Joe Biden', type: 'entity' as const },
  { id: 'putin', name: 'Vladimir Putin', type: 'entity' as const },
  { id: 'mbs', name: 'Mohammed bin Salman', type: 'entity' as const },
  { id: 'zelensky', name: 'Volodymyr Zelensky', type: 'entity' as const },
  { id: 'xi-jinping', name: 'Xi Jinping', type: 'entity' as const },
  { id: 'idf', name: 'IDF', type: 'entity' as const },
  { id: 'hamas', name: 'Hamas', type: 'entity' as const },
];
