'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import {
  getNotificationPrefs, saveNotificationPrefs, requestNotificationPermission,
  sendNotification, AVAILABLE_TOPICS, NotificationPrefs,
} from '@/services/notifications';

export default function NotificationCenter() {
  const { lang } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [permissionState, setPermissionState] = useState<string>('default');

  useEffect(() => {
    setPrefs(getNotificationPrefs());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  if (!prefs) return null;

  const updatePrefs = (partial: Partial<NotificationPrefs>) => {
    const updated = { ...prefs, ...partial };
    setPrefs(updated);
    saveNotificationPrefs(updated);
  };

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(granted ? 'granted' : 'denied');
    updatePrefs({ enabled: granted });
    if (granted) {
      sendNotification(
        lang === 'he' ? '🔔 Signal News' : '🔔 Signal News',
        lang === 'he' ? 'התראות הופעלו בהצלחה!' : 'Notifications enabled successfully!'
      );
    }
  };

  const toggleTopic = (topic: string) => {
    const topics = prefs.topics.includes(topic)
      ? prefs.topics.filter(t => t !== topic)
      : [...prefs.topics, topic];
    updatePrefs({ topics });
  };

  return (
    <div className="space-y-4">
      {/* Permission status */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              🔔 {lang === 'he' ? 'התראות דחיפה' : 'Push Notifications'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              {permissionState === 'granted'
                ? (lang === 'he' ? 'הרשאה ניתנה ✓' : 'Permission granted ✓')
                : permissionState === 'denied'
                  ? (lang === 'he' ? 'הרשאה נדחתה — אפשר דרך הגדרות הדפדפן' : 'Permission denied — enable in browser settings')
                  : (lang === 'he' ? 'צריך הרשאה לשלוח התראות' : 'Permission needed to send alerts')}
            </p>
          </div>
          <button
            onClick={prefs.enabled ? () => updatePrefs({ enabled: false }) : handleEnable}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              prefs.enabled
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/25'
            }`}
          >
            {prefs.enabled
              ? (lang === 'he' ? 'מופעל ✓' : 'Enabled ✓')
              : (lang === 'he' ? 'הפעל התראות' : 'Enable')}
          </button>
        </div>
      </div>

      {/* Alert types */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase">
          {lang === 'he' ? 'סוגי התראות' : 'Alert Types'}
        </h4>
        {[
          {
            key: 'shockAlerts' as const,
            icon: '⚡',
            en: 'Shock Alerts',
            he: 'התראות זעזועים',
            desc_en: 'Get notified when a new shock is detected',
            desc_he: 'קבל התראה כשמזוהה זעזוע חדש',
          },
          {
            key: 'dailyDigest' as const,
            icon: '📋',
            en: 'Daily Digest',
            he: 'סיכום יומי',
            desc_en: 'Morning brief summary at 08:00',
            desc_he: 'סיכום בוקר ב-08:00',
          },
        ].map(alert => (
          <button
            key={alert.key}
            onClick={() => updatePrefs({ [alert.key]: !prefs[alert.key] })}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              prefs[alert.key]
                ? 'bg-yellow-500/5 border-yellow-500/20'
                : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'
            }`}
          >
            <span className="text-lg">{alert.icon}</span>
            <div className="flex-1 text-start">
              <p className="text-sm text-white">{lang === 'he' ? alert.he : alert.en}</p>
              <p className="text-[10px] text-gray-500">{lang === 'he' ? alert.desc_he : alert.desc_en}</p>
            </div>
            <span className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
              prefs[alert.key] ? 'bg-yellow-400 justify-end' : 'bg-gray-700 justify-start'
            }`}>
              <span className="w-4 h-4 rounded-full bg-white shadow" />
            </span>
          </button>
        ))}

        {/* Polymarket delta threshold */}
        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white flex items-center gap-1.5">
                📈 {lang === 'he' ? 'פער Signal vs Market' : 'Signal vs Market Delta'}
              </p>
              <p className="text-[10px] text-gray-500">
                {lang === 'he' ? `התראה כשהפער עולה על ${prefs.polymarketDelta}%` : `Alert when gap exceeds ${prefs.polymarketDelta}%`}
              </p>
            </div>
            <span className="text-sm font-bold text-yellow-400">{prefs.polymarketDelta}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={prefs.polymarketDelta}
            onChange={(e) => updatePrefs({ polymarketDelta: Number(e.target.value) })}
            className="w-full mt-2 accent-yellow-400"
          />
        </div>
      </div>

      {/* Topic subscriptions */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase">
          {lang === 'he' ? 'נושאים במעקב' : 'Watched Topics'}
          <span className="text-gray-600 ms-2">{prefs.topics.length}/{AVAILABLE_TOPICS.length}</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOPICS.map(topic => {
            const isActive = prefs.topics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                    : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                }`}
              >
                {isActive && '✓ '}{topic}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
