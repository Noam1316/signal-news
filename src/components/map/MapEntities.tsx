'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import GeoMap from './GeoMap';
import EntityGraph from '@/components/entities/EntityGraph';

const TABS = [
  { id: 'map', icon: '🗺️', en: 'Geo Map', he: 'מפה' },
  { id: 'entities', icon: '🕸️', en: 'Entity Graph', he: 'גרף ישויות' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function MapEntities() {
  const { lang, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('map');

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-yellow-400">🌍</span>
            {lang === 'he' ? 'מפה וישויות' : 'Map & Entities'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'he'
              ? 'תפוצה גאוגרפית וגרף קשרים בין ישויות'
              : 'Geographic distribution and entity relationship graph'}
          </p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800 max-w-xs">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              {lang === 'he' ? tab.he : tab.en}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'map' && <GeoMap />}
        {activeTab === 'entities' && <EntityGraph />}
      </div>
    </div>
  );
}
