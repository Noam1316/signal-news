'use client';

import { useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { usePreferences, type TopicPreference, type AlertProfile } from '@/contexts/PreferencesContext';

const TOPICS: { id: TopicPreference; en: string; he: string; icon: string }[] = [
  { id: 'middle-east', en: 'Middle East',  he: 'מזרח התיכון', icon: '🕌' },
  { id: 'ukraine',     en: 'Ukraine',      he: 'אוקראינה',    icon: '🇺🇦' },
  { id: 'us-politics', en: 'US Politics',  he: 'פוליטיקה אמריקאית', icon: '🇺🇸' },
  { id: 'iran',        en: 'Iran',         he: 'איראן',       icon: '🇮🇷' },
  { id: 'china',       en: 'China',        he: 'סין',         icon: '🇨🇳' },
  { id: 'energy',      en: 'Energy',       he: 'אנרגיה',      icon: '⚡' },
  { id: 'tech',        en: 'Tech',         he: 'טכנולוגיה',   icon: '💻' },
  { id: 'sports',      en: 'Sports',       he: 'ספורט',       icon: '⚽' },
  { id: 'general',     en: 'General',      he: 'כללי',        icon: '📰' },
];

const SECTIONS = [
  { id: 'brief',  en: 'Brief',   he: 'תקציר',   icon: '📋' },
  { id: 'shocks', en: 'Shocks',  he: 'זעזועים', icon: '⚡' },
  { id: 'map',    en: 'Map',     he: 'מפה',      icon: '🌍' },
  { id: 'intel',  en: 'Intel',   he: 'מודיעין',  icon: '🧠' },
];

const ALERT_PROFILES: { id: AlertProfile; en: string; he: string; desc_en: string; desc_he: string }[] = [
  { id: 'all',      en: 'All Alerts',    he: 'כל ההתראות',    desc_en: 'Every shock detected',           desc_he: 'כל זעזוע שמזוהה' },
  { id: 'critical', en: 'Critical Only', he: 'קריטי בלבד',   desc_en: 'High-confidence shocks only',    desc_he: 'רק זעזועים בביטחון גבוה' },
  { id: 'geo',      en: 'Geopolitical',  he: 'גיאופוליטי',    desc_en: 'Military, diplomacy, conflict',  desc_he: 'צבאי, דיפלומטיה, סכסוכים' },
  { id: 'market',   en: 'Market Movers', he: 'משפיעי שוק',    desc_en: 'Economy, energy, trade signals', desc_he: 'כלכלה, אנרגיה, סחר' },
];

interface Props {
  onClose: () => void;
}

export default function PreferencesPanel({ onClose }: Props) {
  const { lang, dir } = useLanguage();
  const { prefs, setTopics, toggleSection, setAlertProfile, toggleCompact, resetPrefs } = usePreferences();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleTopic = (id: TopicPreference) => {
    if (prefs.topics.includes(id)) {
      setTopics(prefs.topics.filter(t => t !== id));
    } else {
      setTopics([...prefs.topics, id]);
    }
  };

  const activeCount = prefs.topics.length + prefs.hiddenSections.length + (prefs.alertProfile !== 'all' ? 1 : 0) + (prefs.compactMode ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        dir={dir}
        className="relative h-full w-full max-w-sm bg-gray-950 border-s border-gray-800 shadow-2xl overflow-y-auto"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'he' ? 'העדפות דשבורד' : 'Dashboard Preferences'}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {lang === 'he' ? '⚙️ התאמה אישית' : '⚙️ Customize'}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {lang === 'he' ? 'הגדרות נשמרות אוטומטית' : 'Settings saved automatically'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label={lang === 'he' ? 'סגור' : 'Close'}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-7">

          {/* ── Topic Filters ── */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              {lang === 'he' ? '🎯 נושאים מועדפים' : '🎯 Topic Filters'}
              {prefs.topics.length > 0 && (
                <span className="bg-yellow-400 text-gray-950 text-[10px] font-bold px-1.5 rounded-full">{prefs.topics.length}</span>
              )}
            </h3>
            <p className="text-[11px] text-gray-600 mb-3">
              {lang === 'he'
                ? 'בחר נושאים לראות ראשון. ריק = הכל.'
                : 'Select topics to prioritize. Empty = show all.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(topic => {
                const isActive = prefs.topics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'border-yellow-400/60 bg-yellow-400/15 text-yellow-300'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>{topic.icon}</span>
                    {lang === 'he' ? topic.he : topic.en}
                    {isActive && <span className="text-yellow-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Sections Visibility ── */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {lang === 'he' ? '👁️ חלקי הדשבורד' : '👁️ Dashboard Sections'}
            </h3>
            <div className="space-y-2">
              {SECTIONS.map(sec => {
                const isHidden = prefs.hiddenSections.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isHidden
                        ? 'border-gray-800 bg-gray-900/30 text-gray-600'
                        : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600'
                    }`}
                    aria-pressed={!isHidden}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span>{sec.icon}</span>
                      {lang === 'he' ? sec.he : sec.en}
                    </span>
                    <span className={`w-9 h-5 rounded-full transition-colors relative ${isHidden ? 'bg-gray-700' : 'bg-yellow-400'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isHidden ? 'start-0.5' : 'start-4'}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Alert Profile ── */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {lang === 'he' ? '🔔 פרופיל התראות' : '🔔 Alert Profile'}
            </h3>
            <div className="space-y-2">
              {ALERT_PROFILES.map(profile => {
                const isActive = prefs.alertProfile === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => setAlertProfile(profile.id)}
                    className={`w-full text-start px-4 py-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-yellow-400/40 bg-yellow-400/10 text-white'
                        : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{lang === 'he' ? profile.he : profile.en}</span>
                      {isActive && <span className="text-yellow-400 text-xs">✓</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {lang === 'he' ? profile.desc_he : profile.desc_en}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Compact Mode ── */}
          <section>
            <button
              onClick={toggleCompact}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 hover:border-gray-600 transition-all"
              aria-pressed={prefs.compactMode}
            >
              <div className="text-start">
                <div className="text-sm font-medium text-gray-200">
                  {lang === 'he' ? '📐 מצב קומפקטי' : '📐 Compact Mode'}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'he' ? 'כרטיסים צפופים יותר, פחות פערים' : 'Denser cards, less whitespace'}
                </div>
              </div>
              <span className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${prefs.compactMode ? 'bg-yellow-400' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${prefs.compactMode ? 'start-4' : 'start-0.5'}`} />
              </span>
            </button>
          </section>

          {/* ── Reset ── */}
          {activeCount > 0 && (
            <button
              onClick={resetPrefs}
              className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
            >
              {lang === 'he' ? '↺ איפוס הגדרות' : '↺ Reset to defaults'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
