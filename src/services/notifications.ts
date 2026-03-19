/**
 * Browser Push Notifications Service
 * Manages notification permissions, topic subscriptions, and alert triggers
 */

export interface NotificationPrefs {
  enabled: boolean;
  topics: string[];
  shockAlerts: boolean;
  dailyDigest: boolean;
  polymarketDelta: number; // alert when signal-market gap exceeds this %
}

const STORAGE_KEY = 'signal-news-notification-prefs';

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  topics: [],
  shockAlerts: true,
  dailyDigest: false,
  polymarketDelta: 20,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string, icon?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'signal-news-alert',
  });
}

export const AVAILABLE_TOPICS = [
  'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'US Politics',
  'Ukraine War', 'Saudi Relations', 'Tech Industry', 'Economy',
  'Judicial Reform', 'Syria', 'China-Taiwan', 'Climate',
  'Cybersecurity', 'AI Regulation', 'Oil Markets', 'Elections',
];
