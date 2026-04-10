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

export default function BottomNav() {
  const { lang, dir } = useLanguage();
  const { prefs } = usePreferences();
  const [active, setActive] = useState('brief');
  const [showPrefs, setShowPrefs] = useState(false);
  const [mounted, setMounted] = useState(false);

  const activeCount = prefs.topics.length + prefs.hiddenSections.length + (prefs.alertProfile !== 'all' ? 1 : 0) + (prefs.compactMode ? 1 : 0);

  useEffect(() => {
    setMounted(true);
    const observers: IntersectionObserver[] = [];
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(section.id); },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!mounted) return null;

  return (
    <>
      <nav
        dir={dir}
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-950/98 backdrop-blur-xl border-t border-gray-800/70"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {SECTIONS.map(section => {
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 touch-manipulation flex-1 relative
                  ${isActive ? 'text-yellow-400' : 'text-gray-500 active:text-gray-300'}`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-yellow-400" />
                )}
                <span className="text-xl leading-none">{section.icon}</span>
                <span className={`text-[10px] font-medium leading-none mt-0.5 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {lang === 'he' ? section.he : section.en}
                </span>
              </button>
            );
          })}

          {/* Settings */}
          <button
            onClick={() => setShowPrefs(true)}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 touch-manipulation flex-1 relative
              ${activeCount > 0 ? 'text-yellow-400' : 'text-gray-500 active:text-gray-300'}`}
          >
            <span className="text-xl leading-none">⚙️</span>
            <span className={`text-[10px] font-medium leading-none mt-0.5 ${activeCount > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {lang === 'he' ? 'הגדרות' : 'Settings'}
            </span>
            {activeCount > 0 && (
              <span className="absolute top-0.5 end-1 w-4 h-4 bg-yellow-400 text-gray-950 text-[8px] font-bold rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {showPrefs && mounted && createPortal(
        <PreferencesPanel onClose={() => setShowPrefs(false)} />,
        document.body
      )}
    </>
  );
}
