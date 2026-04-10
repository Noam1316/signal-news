'use client';

import { useEffect, useCallback } from 'react';
import type { BriefStory } from '@/lib/types';

const KEY_PREFIX = 'signal_hist_';
const MAX_ENTRIES = 24;       // keep up to 24 snapshots per story
const REAL_DELTA_WINDOW = 6 * 60 * 60 * 1000; // 6 hours

export interface Snapshot { v: number; t: number; } // value, timestamp

export function loadHistory(slug: string): Snapshot[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slug);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(slug: string, snaps: Snapshot[]) {
  try { localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(snaps)); } catch { /* silent */ }
}

/** Push current likelihood into localStorage history for a story */
export function recordLikelihood(slug: string, likelihood: number) {
  const snaps = loadHistory(slug);
  const now = Date.now();
  // Skip if same value recorded in last 15 min (avoid duplicates)
  if (snaps.length > 0 && now - snaps[snaps.length - 1].t < 15 * 60 * 1000) return;
  snaps.push({ v: likelihood, t: now });
  if (snaps.length > MAX_ENTRIES) snaps.splice(0, snaps.length - MAX_ENTRIES);
  saveHistory(slug, snaps);
}

/** Get last N likelihood values as a number[] for sparkline */
export function getSparklineData(slug: string, points = 8): number[] {
  const snaps = loadHistory(slug);
  if (snaps.length < 2) return [];
  return snaps.slice(-points).map(s => s.v);
}

/** Get real delta vs 6h ago (null if not enough data) */
export function getRealDelta(slug: string, current: number): number | null {
  const snaps = loadHistory(slug);
  if (snaps.length < 2) return null;
  const cutoff = Date.now() - REAL_DELTA_WINDOW;
  const older = snaps.filter(s => s.t <= cutoff);
  if (older.length === 0) return null;
  const ref = older[older.length - 1].v; // most recent snapshot older than 6h
  return Math.round(current - ref);
}

/** Record all stories on mount */
export function useRecordStories(stories: BriefStory[]) {
  const record = useCallback(() => {
    for (const s of stories) recordLikelihood(s.slug, s.likelihood);
  }, [stories]);

  useEffect(() => { record(); }, [record]);
}
