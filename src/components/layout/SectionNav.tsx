'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/context';
import { usePreferences } from '@/contexts/PreferencesContext';

const PreferencesPanel = dynamic(() => import('@/components/preferences/PreferencesPanel'), { ssr: false });

const SECTIONS = [
  { id: 'brief',  icon: '📋', en: 'Brief',  he: 'תקציר' },
  { id: 'shocks', icon: '⚡', en: 'Shocks', he: 'זעזועים' },
  { id: 'map',    icon: '🌍', en: 'Map',    he: 'מפה' },
  { id: 'intel',  icon: '🧠', en: 'Intel',  he: 'מודיעין' },
];

export default function SectionNav() {
  const { lang, dir } = useLanguage();
  const { prefs } = usePreferences();
  const [active, setActive] = useState('brief');
  const [showPrefs, setShowPrefs] = useState(false);

  const activeCount = prefs.topics.length + prefs.hiddenSections.length + (prefs.alertProfile !== 'all' ? 1 : 0) + (prefs.compactMode ? 1 : 0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(section.id);
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      dir={dir}
      className="sticky top-14 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50"
    >
      <div className="max-w-5xl mx-auto flex items-center gap-0 sm:gap-1 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
        {/* Section tabs — hidden on mobile (BottomNav handles mobile nav) */}
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`hidden md:flex shrink-0 items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap
                         border-b-2 transition-all duration-200 touch-manipulation
                ${isActive
                  ? 'border-yellow-400 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300 active:text-gray-200'
                }`}
            >
              <span className="text-base sm:text-xs">{section.icon}</span>
              <span className="hidden sm:inline">{lang === 'he' ? section.he : section.en}</span>
            </button>
          );
        })}

        {/* Mobile: show active section label */}
        <div className="md:hidden flex items-center gap-2 py-3 px-1">
          <span className="text-xs text-gray-500">{lang === 'he' ? 'קטע:' : 'Section:'}</span>
          <span className="text-xs font-semibold text-yellow-400">
            {SECTIONS.find(s => s.id === active)?.[lang === 'he' ? 'he' : 'en']}
          </span>
        </div>

        {/* Customize button — desktop only (mobile uses BottomNav settings) */}
        <button
          onClick={() => setShowPrefs(true)}
          className={`hidden md:flex ms-auto shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            activeCount > 0
              ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400'
              : 'border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
          }`}
          aria-label={lang === 'he' ? 'התאמה אישית' : 'Customize dashboard'}
        >
          ⚙️
          {activeCount > 0 && (
            <span className="bg-yellow-400 text-gray-950 text-[10px] font-bold px-1.5 rounded-full">{activeCount}</span>
          )}
        </button>

        {showPrefs && typeof document !== 'undefined' && createPortal(
          <PreferencesPanel onClose={() => setShowPrefs(false)} />,
          document.body
        )}
      </div>
    </nav>
  );
}
