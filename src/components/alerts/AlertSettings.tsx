'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { useNotificationSettings, type TopicAlert } from '@/hooks/useNotificationSettings';

interface Props {
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  notifPermission: NotificationPermission;
}

export default function AlertSettings({ onClose, onRequestPermission, notifPermission }: Props) {
  const { lang, dir } = useLanguage();
  const { settings, update, addKeyword, removeKeyword, addTopicAlert, removeTopicAlert, updateTopicAlert } = useNotificationSettings();
  const [kwInput, setKwInput] = useState('');
  const [alertKwInput, setAlertKwInput] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(70);
  const inputRef = useRef<HTMLInputElement>(null);
  const alertInputRef = useRef<HTMLInputElement>(null);
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

  const handleAddAlert = () => {
    if (!alertKwInput.trim()) return;
    addTopicAlert(alertKwInput.trim(), alertThreshold);
    setAlertKwInput('');
    alertInputRef.current?.focus();
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

        {/* ── Likelihood Threshold ── */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>{lang === 'he' ? '📊 סף סבירות מינימלי' : '📊 Min Likelihood Threshold'}</span>
            <span className={`text-sm font-black ${
              settings.minLikelihood >= 70 ? 'text-emerald-400' : settings.minLikelihood >= 45 ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {settings.minLikelihood === 0 ? (lang === 'he' ? 'הכל' : 'All') : `${settings.minLikelihood}%+`}
            </span>
          </h4>
          <p className="text-[10px] text-gray-600">
            {lang === 'he'
              ? 'התראה רק כשסבירות הזעזוע גבוהה מ...'
              : 'Only alert when shock likelihood exceeds...'}
          </p>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={settings.minLikelihood}
            onChange={e => update({ minLikelihood: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-yellow-400 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-gray-600">
            <span>{lang === 'he' ? 'הכל' : 'All'}</span>
            <span>45%</span>
            <span>70%</span>
            <span>90%+</span>
          </div>
        </section>

        {/* ── Topic Likelihood Alerts ── */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {lang === 'he' ? '🎯 התראות נושא + סף' : '🎯 Topic + Threshold Alerts'}
            {(settings.topicAlerts || []).length > 0 && (
              <span className="bg-yellow-400 text-gray-950 text-[10px] font-bold px-1.5 rounded-full">
                {(settings.topicAlerts || []).length}
              </span>
            )}
          </h4>
          <p className="text-[10px] text-gray-600">
            {lang === 'he'
              ? 'קבל התראה כאשר נושא ספציפי חוצה סף סבירות'
              : 'Alert when a specific topic crosses a likelihood threshold'}
          </p>

          {/* Existing topic alerts */}
          <div className="space-y-1.5">
            {(settings.topicAlerts || []).map((alert: TopicAlert) => (
              <div key={alert.keyword} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50">
                <span className="text-xs text-yellow-300 font-medium flex-1 truncate">{alert.keyword}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">{lang === 'he' ? 'סף:' : 'at'}</span>
                  <select
                    value={alert.threshold}
                    onChange={e => updateTopicAlert(alert.keyword, Number(e.target.value))}
                    className="text-[10px] bg-gray-900 border border-gray-700 text-yellow-400 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                  >
                    {[30, 40, 50, 60, 70, 80, 90].map(v => (
                      <option key={v} value={v}>{v}%</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => removeTopicAlert(alert.keyword)}
                  className="text-gray-600 hover:text-red-400 text-xs"
                >✕</button>
              </div>
            ))}
            {(settings.topicAlerts || []).length === 0 && (
              <p className="text-[10px] text-gray-600 italic px-1">
                {lang === 'he' ? 'אין התראות נושא — הוסף למטה' : 'No topic alerts yet — add below'}
              </p>
            )}
          </div>

          {/* Add new topic alert */}
          <div className="flex gap-2 items-center">
            <input
              ref={alertInputRef}
              type="text"
              value={alertKwInput}
              onChange={e => setAlertKwInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddAlert()}
              placeholder={lang === 'he' ? 'נושא (כגון: איראן)' : 'Topic (e.g. Iran)'}
              dir={dir}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
            />
            <select
              value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))}
              className="text-[10px] bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              {[30, 40, 50, 60, 70, 80, 90].map(v => (
                <option key={v} value={v}>{v}%</option>
              ))}
            </select>
            <button
              onClick={handleAddAlert}
              className="px-3 py-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-bold hover:bg-yellow-400/25 transition-colors"
            >
              +
            </button>
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
