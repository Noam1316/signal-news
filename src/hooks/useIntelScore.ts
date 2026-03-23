'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'signal_intel_score';

interface IntelScoreData {
  today: string; // YYYY-MM-DD
  storiesViewed: number;
  shocksViewed: number;
  streak: number;
  lastActiveDate: string;
  totalDays: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStored(): IntelScoreData {
  if (typeof window === 'undefined') {
    return { today: getToday(), storiesViewed: 0, shocksViewed: 0, streak: 0, lastActiveDate: '', totalDays: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { today: getToday(), storiesViewed: 0, shocksViewed: 0, streak: 0, lastActiveDate: '', totalDays: 0 };
    const parsed = JSON.parse(raw) as IntelScoreData;

    const today = getToday();
    if (parsed.today !== today) {
      // New day — check streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const isConsecutive = parsed.today === yesterday;
      return {
        today,
        storiesViewed: 0,
        shocksViewed: 0,
        streak: isConsecutive ? parsed.streak + 1 : 1,
        lastActiveDate: parsed.today,
        totalDays: parsed.totalDays + (isConsecutive ? 1 : 0),
      };
    }
    return parsed;
  } catch {
    return { today: getToday(), storiesViewed: 0, shocksViewed: 0, streak: 0, lastActiveDate: '', totalDays: 0 };
  }
}

function save(data: IntelScoreData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* silent */ }
}

/**
 * Daily Intel Score + Streak counter.
 * Score = stories read * 10 + shocks viewed * 25 (max 100).
 */
export function useIntelScore() {
  const [data, setData] = useState<IntelScoreData>(getStored);

  useEffect(() => { setData(getStored()); }, []);

  const recordStoryView = useCallback(() => {
    setData(prev => {
      const next = { ...prev, storiesViewed: prev.storiesViewed + 1 };
      save(next);
      return next;
    });
  }, []);

  const recordShockView = useCallback(() => {
    setData(prev => {
      const next = { ...prev, shocksViewed: prev.shocksViewed + 1 };
      save(next);
      return next;
    });
  }, []);

  const score = Math.min(100, data.storiesViewed * 10 + data.shocksViewed * 25);
  const streak = data.streak;
  const level = score >= 80 ? 'expert' : score >= 50 ? 'analyst' : score >= 20 ? 'reader' : 'newcomer';

  return {
    score,
    streak,
    level,
    storiesViewed: data.storiesViewed,
    shocksViewed: data.shocksViewed,
    recordStoryView,
    recordShockView,
  };
}
