'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

interface Props {
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  notifPermission: NotificationPermission;
}

export default function AlertSettings({ onClose, onRequestPermission, notifPermission }: Props) {
  const { lang, dir } = useLanguage();
  const { settings, update, addKeyword, removeKeyword } = useNotificationSettings();
  const [kwInput, setKwInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAddKw = () => {
    if (!kwInput.trim()) return;
    addKeyword(kwInput.trim());
    setKwInput('');
    inputRef.current?.focus();
  };

  const SHOCK_TYPES = [
    { id: 'likelihood', he: 'שינוי סבירות', en: 'Likelihood shift' },
    { id: 'narrative',  he: 'פיצול נרטיב', en: 'Narrative split' },
    { id: 'fragmentation', he: 'פיצול תקשורתי', en: 'Media fragmentation' },
  ] as const;

  return (
    <div
      ref={panelRef}
      dir={dir}
      className="absolute top-full end-0 mt-2 w-80 rounded-2xl bg-gray-900 border border-gray-700
                 shadow-2xl z-[300] overflow-hidden animate-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-bold text-white">
          {lang === 'he' ? '🔔 הגדרות התראות' : '🔔 Alert Settings'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
      </div>

      <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">

        {/* Permission status */}
        {notifPermission !== 'granted' && (
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
            notifPermission === 'denied'
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-400'
          }`}>
            <span className="text-base shrink-0">{notifPermission === 'denied' ? '🚫' : '⚠️'}</span>
            <div>
              {notifPermission === 'denied'
                ? (lang === 'he' ? 'התראות חסומות בדפדפן — פתח הגדרות דפדפן להפעלה' : 'Blocked in browser — open browser settings to enable')
                : (lang === 'he' ? 'דרושה הרשאה להתראות' : 'Notification permission required')
              }
              {notifPermission === 'default' && (
                <button
                  onClick={onRequestPermission}
                  className="block mt-1 font-bold underline hover:no-underline"
                >
                  {lang === 'he' ? 'לחץ להפעלה' : 'Click to enable'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Topic Keywords ── */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {lang === 'he' ? '🎯 מילות מפתח' : '🎯 Topic Keywords'}
          </h4>
          <p className="text-[10px] text-gray-600">
            {lang === 'he'
              ? 'קבל התראה רק כשהנושא מכיל אחת מהמילים האלו'
              : 'Alert only when shock contains one of these keywords'}
          </p>

          {/* Existing keywords */}
          <div className="flex flex-wrap gap-1.5">
            {settings.topicKeywords.map(kw => (
              <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="text-yellow-500/60 hover:text-yellow-300 text-[10px] ml-0.5">✕</button>
              </span>
            ))}
            {settings.topicKeywords.length === 0 && (
              <span className="text-[10px] text-gray-600 italic">
                {lang === 'he' ? 'כל הנושאים (ריק = הכל)' : 'All topics (empty = all)'}
              </span>
            )}
          </div>

          {/* Add keyword */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={kwInput}
              onChange={e => setKwInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddKw()}
              placeholder={lang === 'he' ? 'הוסף מילת מפתח...' : 'Add keyword...'}
              dir={dir}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
            />
            <button
              onClick={handleAddKw}
              className="px-3 py-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-bold hover:bg-yellow-400/25 transition-colors"
            >
              +
            </button>
          </div>
        </section>

        {/* ── Shock Types ── */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {lang === 'he' ? '⚡ סוגי זעזועים' : '⚡ Shock Types'}
          </h4>
          <div className="space-y-1.5">
            {SHOCK_TYPES.map(({ id, he, en }) => {
              const checked = settings.shockTypes.includes(id);
              return (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => {
                      const next = checked
                        ? settings.shockTypes.filter(t => t !== id)
                        : [...settings.shockTypes, id];
                      update({ shockTypes: next });
                    }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer
                                ${checked ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600 group-hover:border-gray-400'}`}
                  >
                    {checked && <span className="text-gray-950 text-[9px] font-black">✓</span>}
                  </div>
                  <span className="text-xs text-gray-300">
                    {lang === 'he' ? he : en}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ── Daily Brief ── */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {lang === 'he' ? '📅 תזכורת יומית' : '📅 Daily Brief'}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">
              {lang === 'he' ? 'שלח לי תזכורת בוקר' : 'Send me a morning reminder'}
            </span>
            {/* Toggle */}
            <button
              onClick={() => update({ dailyBriefEnabled: !settings.dailyBriefEnabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                settings.dailyBriefEnabled ? 'bg-yellow-400' : 'bg-gray-700'
              }`}
              disabled={notifPermission !== 'granted'}
              title={notifPermission !== 'granted' ? (lang === 'he' ? 'דרושה הרשאה' : 'Permission required') : ''}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                settings.dailyBriefEnabled ? 'end-0.5' : 'start-0.5'
              }`} />
            </button>
          </div>

          {/* Time picker */}
          {settings.dailyBriefEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{lang === 'he' ? 'בשעה:' : 'At:'}</span>
              <input
                type="time"
                value={settings.dailyBriefTime}
                onChange={e => update({ dailyBriefTime: e.target.value })}
                className="text-xs px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-200
                           focus:outline-none focus:border-yellow-400/50"
              />
              <span className="text-[10px] text-gray-600">
                {lang === 'he' ? 'כל יום' : 'every day'}
              </span>
            </div>
          )}
          {settings.dailyBriefEnabled && notifPermission !== 'granted' && (
            <p className="text-[10px] text-yellow-500/70">
              {lang === 'he' ? 'דרוש: הפעל התראות ← למעלה' : 'Required: enable notifications above'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
