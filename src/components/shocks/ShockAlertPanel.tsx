'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

// Suggested alert keywords (common geopolitical topics)
const SUGGESTIONS = ['איראן', 'עזה', 'נתניהו', 'חמאס', 'Iran', 'Gaza', 'Biden', 'הסכם'];

export default function ShockAlertPanel() {
  const { lang, dir } = useLanguage();
  const { settings, addKeyword, removeKeyword } = useNotificationSettings();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed) {
      addKeyword(trimmed);
      setInput('');
    }
  };

  const hasKeywords = settings.topicKeywords.length > 0;

  return (
    <div dir={dir}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
          hasKeywords
            ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
            : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
        }`}
      >
        <span>🔔</span>
        {hasKeywords
          ? `${settings.topicKeywords.length} ${lang === 'he' ? 'התראות' : 'alerts'}`
          : lang === 'he' ? 'הגדר התראה' : 'Set Alert'}
      </button>

      {open && (
        <div className="mt-2 p-4 rounded-xl bg-gray-900 border border-gray-700 space-y-3">
          <p className="text-[11px] text-gray-400">
            {lang === 'he'
              ? 'קבל התראה כשזעזוע מכיל מילות מפתח אלו:'
              : 'Get alerted when a shock contains these keywords:'}
          </p>

          {/* Active keyword chips */}
          {hasKeywords && (
            <div className="flex flex-wrap gap-1.5">
              {settings.topicKeywords.map(kw => (
                <span
                  key={kw}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="text-yellow-500/70 hover:text-yellow-200 leading-none"
                    aria-label={`Remove ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {!hasKeywords && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => addKeyword(s)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={lang === 'he' ? 'למשל: איראן, עזה...' : 'e.g., Iran, Gaza...'}
              className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
              dir={dir}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lang === 'he' ? 'הוסף' : 'Add'}
            </button>
          </div>

          {/* Browser notification permission */}
          {notifPermission === 'granted' ? (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span>✓</span>
              {lang === 'he' ? 'התראות דפדפן מופעלות' : 'Browser notifications enabled'}
            </p>
          ) : (
            <button
              onClick={requestPermission}
              className="text-[11px] text-blue-400 hover:text-blue-300 underline"
            >
              {lang === 'he' ? 'אפשר התראות דפדפן' : 'Enable browser notifications'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
