'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import IntelDashboard from './IntelDashboard';
import PolymarketComparison from './PolymarketComparison';
import MediaBiasPanel from './MediaBiasPanel';
import LiveWire from '@/components/explore/LiveWire';
import GroupedFeed from './GroupedFeed';
import CredibilityDashboard from '@/components/credibility/CredibilityDashboard';
import GeoCalendar from './GeoCalendar';
import IntelSynthesis from './IntelSynthesis';
import SocialBuzz from './SocialBuzz';

const TABS = [
  { id: 'polymarket', icon: '📈', en: 'Signal vs Market', he: 'סיגנל vs שוק' },
  { id: 'overview',   icon: '📊', en: 'Overview',         he: 'סקירה' },
  { id: 'bias',       icon: '🏛️', en: 'Media & Sources',  he: 'תקשורת ומקורות' },
  { id: 'feed',       icon: '📡', en: 'Live Feed',        he: 'פיד חי' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function IntelHub() {
  const { lang, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('polymarket');

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <header>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">🧠</span>
          {lang === 'he' ? 'מרכז מודיעין' : 'Intelligence Hub'}
        </h2>
      </header>

      {/* AI Synthesis */}
      <IntelSynthesis />

      {/* Tab bar — exactly 4 tabs */}
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
                const isRtl = dir === 'rtl';
                const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
                const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
                if (e.key === nextKey || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveTab(tabs[(currentIdx + 1) % tabs.length] as TabId);
                } else if (e.key === prevKey || e.key === 'ArrowUp') {
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
      <div role="tabpanel" className="min-h-[300px]">
        {activeTab === 'polymarket' && <PolymarketComparison />}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <IntelDashboard />
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🌐</span>
                {lang === 'he' ? 'רשתות חברתיות ועצמאיות' : 'Social & Independent Media'}
              </h3>
              <SocialBuzz />
            </div>
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>📅</span>
                {lang === 'he' ? 'לוח אירועים גיאופוליטי' : 'Geopolitical Calendar'}
              </h3>
              <GeoCalendar />
            </div>
          </div>
        )}

        {activeTab === 'bias' && (
          <div className="space-y-8">
            <MediaBiasPanel />
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🛡️</span>
                {lang === 'he' ? 'מקורות ואמינות' : 'Sources & Credibility'}
              </h3>
              <GroupedFeed />
              <div className="mt-6">
                <CredibilityDashboard />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feed' && <LiveWire />}
      </div>
    </div>
  );
}
