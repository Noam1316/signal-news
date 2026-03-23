'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'signal_personalization';
const DECAY_DAYS = 7;

interface PersonalizationData {
  topicClicks: Record<string, number>;
  lastClickTimes: Record<string, number>;
  totalClicks: number;
}

function getStored(): PersonalizationData {
  if (typeof window === 'undefined') return { topicClicks: {}, lastClickTimes: {}, totalClicks: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { topicClicks: {}, lastClickTimes: {}, totalClicks: 0 };
  } catch {
    return { topicClicks: {}, lastClickTimes: {}, totalClicks: 0 };
  }
}

function save(data: PersonalizationData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* silent */ }
}

/**
 * Personalization hook — tracks topic clicks, provides interest-weighted scoring.
 * Uses exponential decay so recent clicks matter more.
 */
export function usePersonalization() {
  const [data, setData] = useState<PersonalizationData>(getStored);

  useEffect(() => { setData(getStored()); }, []);

  const recordClick = useCallback((category: string) => {
    setData(prev => {
      const next = {
        topicClicks: { ...prev.topicClicks, [category]: (prev.topicClicks[category] || 0) + 1 },
        lastClickTimes: { ...prev.lastClickTimes, [category]: Date.now() },
        totalClicks: prev.totalClicks + 1,
      };
      save(next);
      return next;
    });
  }, []);

  /**
   * Returns a weight (0–1) for a given category based on user history.
   * Higher = more interesting to this user.
   */
  const getInterestWeight = useCallback((category: string): number => {
    const clicks = data.topicClicks[category] || 0;
    if (clicks === 0) return 0;

    const lastClick = data.lastClickTimes[category] || 0;
    const daysSince = (Date.now() - lastClick) / (1000 * 60 * 60 * 24);
    const decay = Math.exp(-daysSince / DECAY_DAYS);

    const maxClicks = Math.max(1, ...Object.values(data.topicClicks));
    return (clicks / maxClicks) * decay;
  }, [data]);

  /**
   * Returns top interests sorted by weight.
   */
  const getTopInterests = useCallback((limit = 5): { topic: string; weight: number }[] => {
    return Object.keys(data.topicClicks)
      .map(topic => ({ topic, weight: getInterestWeight(topic) }))
      .filter(i => i.weight > 0.05)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }, [data, getInterestWeight]);

  /**
   * Checks if a category is "outside the user's lane" — anti-filter-bubble.
   */
  const isOutsideLane = useCallback((category: string): boolean => {
    if (data.totalClicks < 5) return false; // not enough data
    const weight = getInterestWeight(category);
    return weight < 0.1;
  }, [data, getInterestWeight]);

  return { recordClick, getInterestWeight, getTopInterests, isOutsideLane, totalClicks: data.totalClicks };
}
