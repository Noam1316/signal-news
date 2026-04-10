'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

type Status = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export default function PushSubscribe() {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') setStatus('granted');
    else if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    setStatus('requesting');
    const result = await Notification.requestPermission();
    setStatus(result === 'granted' ? 'granted' : 'denied');

    // Once granted, show a test notification
    if (result === 'granted') {
      new Notification(lang === 'he' ? '✅ זיקוק — התראות מופעלות' : '✅ Zikuk — Alerts enabled', {
        body: lang === 'he' ? 'תקבל התראה כשיתגלה סיגנל חדש' : 'You\'ll be notified when a new signal is detected',
        icon: '/favicon.svg',
      });
    }
  };

  if (status === 'unsupported' || status === 'denied') return null;
  if (status === 'granted') return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {lang === 'he' ? 'התראות פעילות' : 'Alerts on'}
    </span>
  );

  return (
    <button
      onClick={requestPermission}
      disabled={status === 'requesting'}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
                 border border-indigo-500/40 bg-indigo-500/10 text-indigo-400
                 hover:bg-indigo-500/20 hover:border-indigo-400/60
                 disabled:opacity-50 transition-colors shrink-0"
    >
      <span>{status === 'requesting' ? '⏳' : '🔔'}</span>
      <span>
        {status === 'requesting'
          ? (lang === 'he' ? 'מאשר...' : 'Enabling...')
          : (lang === 'he' ? 'התראות Push' : 'Push alerts')}
      </span>
    </button>
  );
}
