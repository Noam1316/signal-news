'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ShockEvent } from '@/lib/types';
import { shockMatchesKeywords } from '@/hooks/useNotificationSettings';

export interface ShockToast {
  id: string;
  shock: ShockEvent;
  seenAt: number;
  isTopicMatch?: boolean;
}

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes
const SESSION_KEY = 'signal_known_shocks';
const SETTINGS_KEY = 'signal_notif_settings';

function getKnownIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveKnownIds(ids: Set<string>) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...ids])); } catch { /* silent */ }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useShockAlerts() {
  const [toasts, setToasts] = useState<ShockToast[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [newCount, setNewCount] = useState(0);
  const isInitialLoad = useRef(true);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission);
    knownIds.current = getKnownIds();
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchAndDetect = useCallback(async () => {
    try {
      const res = await fetch('/api/shocks');
      if (!res.ok) return;
      const data = await res.json();
      const shocks: ShockEvent[] = data.shocks || [];

      if (isInitialLoad.current) {
        for (const s of shocks) knownIds.current.add(s.id);
        saveKnownIds(knownIds.current);
        isInitialLoad.current = false;
        return;
      }

      const settings = loadSettings();
      const allowedTypes: string[] = settings.shockTypes || ['likelihood', 'narrative', 'fragmentation'];
      const keywords: string[] = settings.topicKeywords || [];

      const newShocks = shocks.filter(s => !knownIds.current.has(s.id));
      if (newShocks.length === 0) return;

      for (const s of newShocks) knownIds.current.add(s.id);
      saveKnownIds(knownIds.current);

      // Filter by shock type preference
      const filtered = newShocks.filter(s => allowedTypes.includes(s.type));

      // Identify topic matches
      const withMatch = filtered.map(s => ({
        s,
        isTopicMatch: keywords.length > 0 && shockMatchesKeywords(
          s.headline?.he || s.headline?.en || '',
          s.whatMoved?.he || s.whatMoved?.en || '',
          keywords
        ),
      }));

      // Topic matches get priority — always show, others only if no keywords filter
      const toShow = keywords.length > 0
        ? withMatch.filter(x => x.isTopicMatch)
        : withMatch;

      if (toShow.length === 0) return;

      const newToasts: ShockToast[] = toShow.map(({ s, isTopicMatch }) => ({
        id: `toast-${s.id}-${Date.now()}`,
        shock: s,
        seenAt: Date.now(),
        isTopicMatch,
      }));
      setToasts(prev => [...newToasts, ...prev].slice(0, 5));
      setNewCount(prev => prev + toShow.length);

      // Browser notifications
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        for (const { s, isTopicMatch } of toShow.slice(0, 3)) {
          const title = s.headline?.he || s.headline?.en || 'Signal Alert';
          const body = s.whatMoved?.he || s.whatMoved?.en || '';
          new Notification(`${isTopicMatch ? '🎯' : '⚡'} ${title}`, {
            body,
            icon: '/favicon.ico',
            tag: s.id,
          });
        }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAndDetect();
    const interval = setInterval(fetchAndDetect, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAndDetect]);

  const clearNewCount = useCallback(() => setNewCount(0), []);

  return { toasts, notifPermission, newCount, requestPermission, dismissToast, clearNewCount };
}
