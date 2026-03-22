'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationSettings {
  topicKeywords: string[];       // e.g. ["Gaza", "Iran", "ביידן"]
  shockTypes: ('likelihood' | 'narrative' | 'fragmentation')[]; // which shock types to alert on
  dailyBriefEnabled: boolean;
  dailyBriefTime: string;        // "HH:MM" format, e.g. "08:00"
  minLikelihood: number;         // 0-100, default 0 (all)
}

const KEY = 'signal_notif_settings';
const DEFAULT: NotificationSettings = {
  topicKeywords: [],
  shockTypes: ['likelihood', 'narrative', 'fragmentation'],
  dailyBriefEnabled: false,
  dailyBriefTime: '08:00',
  minLikelihood: 0,
};

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}

function save(s: NotificationSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* silent */ }
}

function msUntilTime(timeStr: string): number {
  const [hh, mm] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT);
  const dailyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSettings(load()); }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const addKeyword = useCallback((kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setSettings(prev => {
      if (prev.topicKeywords.includes(trimmed)) return prev;
      const next = { ...prev, topicKeywords: [...prev.topicKeywords, trimmed] };
      save(next);
      return next;
    });
  }, []);

  const removeKeyword = useCallback((kw: string) => {
    setSettings(prev => {
      const next = { ...prev, topicKeywords: prev.topicKeywords.filter(k => k !== kw) };
      save(next);
      return next;
    });
  }, []);

  // Schedule daily brief notification
  useEffect(() => {
    if (!settings.dailyBriefEnabled) {
      if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current);
      return;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    function scheduleDailyBrief() {
      const ms = msUntilTime(settings.dailyBriefTime);
      dailyTimerRef.current = setTimeout(() => {
        new Notification('⚡ Signal — Daily Brief', {
          body: 'הגיע הזמן לבדוק את הסיגנלים היומיים שלך',
          icon: '/favicon.ico',
          tag: 'daily-brief',
        });
        scheduleDailyBrief(); // reschedule for next day
      }, ms);
    }

    scheduleDailyBrief();
    return () => { if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current); };
  }, [settings.dailyBriefEnabled, settings.dailyBriefTime]);

  return { settings, update, addKeyword, removeKeyword };
}

/** Check if a shock matches user topic keywords */
export function shockMatchesKeywords(
  shockHeadline: string,
  shockWhatMoved: string,
  keywords: string[]
): boolean {
  if (!keywords.length) return false;
  const text = `${shockHeadline} ${shockWhatMoved}`.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}
