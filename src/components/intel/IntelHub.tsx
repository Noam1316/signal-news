'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import IntelDashboard from './IntelDashboard';
import PolymarketComparison from './PolymarketComparison';
import MediaBiasPanel from './MediaBiasPanel';
import LiveWire from '@/components/explore/LiveWire';
import GroupedFeed from './GroupedFeed';

const TABS = [
  { id: 'overview', icon: '📊', en: 'Overview', he: 'סקירה' },
  { id: 'polymarket', icon: '📈', en: 'Signal vs Market', he: 'סיגנל vs שוק' },
  { id: 'bias', icon: '🏛️', en: 'Media Bias', he: 'הטיה תקשורתית' },
  { id: 'grouped', icon: '🗞️', en: 'Grouped', he: 'מקובץ' },
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
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">🧠</span>
          {lang === 'he' ? 'מרכז מודיעין' : 'Intelligence Hub'}
        </h2>
      </header>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                const tabs = TABS.map(t => t.id);
                const currentIdx = tabs.indexOf(activeTab);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveTab(tabs[(currentIdx + 1) % tabs.length] as TabId);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveTab(tabs[(currentIdx - 1 + tabs.length) % tabs.length] as TabId);
                }
              }}
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
      <div role="tabpanel" aria-label={lang === 'he' ? TABS.find(t => t.id === activeTab)?.he : TABS.find(t => t.id === activeTab)?.en} className="min-h-[300px]">
        {activeTab === 'overview' && <IntelDashboard />}
        {activeTab === 'polymarket' && <PolymarketComparison />}
        {activeTab === 'bias' && <MediaBiasPanel />}
        {activeTab === 'grouped' && <GroupedFeed />}
        {activeTab === 'feed' && <LiveWire />}
      </div>
    </div>
  );
}
