'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'signal_accuracy_tracker';

interface ResolvedPrediction {
  marketId: string;
  signalHigher: boolean; // was Signal higher than market?
  signalWon: boolean;    // did reality match Signal's direction?
  resolvedAt: string;
}

interface AccuracyData {
  predictions: ResolvedPrediction[];
  signalWins: number;
  marketWins: number;
}

function getStored(): AccuracyData {
  if (typeof window === 'undefined') return { predictions: [], signalWins: 0, marketWins: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { predictions: [], signalWins: 0, marketWins: 0 };
  } catch {
    return { predictions: [], signalWins: 0, marketWins: 0 };
  }
}

function save(data: AccuracyData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* silent */ }
}

/**
 * Tracks Signal vs Market prediction accuracy over time.
 */
export function useAccuracyTracker() {
  const [data, setData] = useState<AccuracyData>(getStored);

  useEffect(() => { setData(getStored()); }, []);

  const recordResolution = useCallback((marketId: string, signalHigher: boolean, signalWon: boolean) => {
    setData(prev => {
      // Don't record duplicates
      if (prev.predictions.some(p => p.marketId === marketId)) return prev;

      const next: AccuracyData = {
        predictions: [...prev.predictions, { marketId, signalHigher, signalWon, resolvedAt: new Date().toISOString() }].slice(-100),
        signalWins: prev.signalWins + (signalWon ? 1 : 0),
        marketWins: prev.marketWins + (signalWon ? 0 : 1),
      };
      save(next);
      return next;
    });
  }, []);

  const totalResolved = data.predictions.length;
  const signalAccuracy = totalResolved > 0 ? Math.round((data.signalWins / totalResolved) * 100) : null;

  return {
    signalWins: data.signalWins,
    marketWins: data.marketWins,
    totalResolved,
    signalAccuracy,
    recordResolution,
  };
}
