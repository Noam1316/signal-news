'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import NotificationCenter from './NotificationCenter';
import TrackRecord from './TrackRecord';
import Watchlist from './Watchlist';
import DailyDigest from './DailyDigest';
import ApiDocs from './ApiDocs';
import ExportTools from './ExportTools';
import KeyboardShortcutsPanel from './KeyboardShortcuts';
import LanguageSources from './LanguageSources';

const TABS = [
  { id: 'track-record', icon: '📊', en: 'Track Record', he: 'היסטוריית דיוק' },
  { id: 'watchlist', icon: '⭐', en: 'Watchlist', he: 'רשימת מעקב' },
  { id: 'notifications', icon: '🔔', en: 'Alerts', he: 'התראות' },
  { id: 'digest', icon: '📧', en: 'Daily Digest', he: 'סיכום יומי' },
  { id: 'export', icon: '📄', en: 'Export', he: 'ייצוא' },
  { id: 'api', icon: '🔗', en: 'API', he: 'API' },
  { id: 'shortcuts', icon: '⌨️', en: 'Shortcuts', he: 'קיצורים' },
  { id: 'sources', icon: '🌐', en: 'Sources', he: 'מקורות' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function FeaturesHub() {
  const { lang, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('track-record');

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">✨</span>
          {lang === 'he' ? 'פיצ\'רים' : 'Features'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'he'
            ? 'התראות, מעקב אישי, ייצוא, API ועוד'
            : 'Alerts, watchlist, export, API access & more'}
        </p>
      </header>

      {/* Tab grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="truncate text-[10px]">{lang === 'he' ? tab.he : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'track-record' && <TrackRecord />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'notifications' && <NotificationCenter />}
        {activeTab === 'digest' && <DailyDigest />}
        {activeTab === 'export' && <ExportTools />}
        {activeTab === 'api' && <ApiDocs />}
        {activeTab === 'shortcuts' && <KeyboardShortcutsPanel />}
        {activeTab === 'sources' && <LanguageSources />}
      </div>
    </div>
  );
}
