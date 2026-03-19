'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import IntelDashboard from './IntelDashboard';
import PolymarketComparison from './PolymarketComparison';
import MediaBiasPanel from './MediaBiasPanel';
import LiveWire from '@/components/explore/LiveWire';

const TABS = [
  { id: 'overview', icon: '📊', en: 'Overview', he: 'סקירה' },
  { id: 'polymarket', icon: '📈', en: 'Signal vs Market', he: 'סיגנל vs שוק' },
  { id: 'bias', icon: '🏛️', en: 'Media Bias', he: 'הטיה תקשורתית' },
  { id: 'feed', icon: '🌐', en: 'Live Feed', he: 'פיד חי' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function IntelHub() {
  const { lang, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">🧠</span>
          {lang === 'he' ? 'מרכז מודיעין' : 'Intelligence Hub'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'he'
            ? 'ניתוח AI, שווקי תחזיות, הטיה תקשורתית ופיד חי'
            : 'AI analysis, prediction markets, media bias & live feed'}
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span className="hidden sm:inline">{lang === 'he' ? tab.he : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <IntelDashboard />}
        {activeTab === 'polymarket' && <PolymarketComparison />}
        {activeTab === 'bias' && <MediaBiasPanel />}
        {activeTab === 'feed' && <LiveWire />}
      </div>
    </div>
  );
}
