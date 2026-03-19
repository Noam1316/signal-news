'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

const SECTIONS = [
  { id: 'brief',  icon: '📋', en: 'Brief',    he: 'תקציר' },
  { id: 'shocks', icon: '⚡', en: 'Shocks',   he: 'זעזועים' },
  { id: 'map',    icon: '🌍', en: 'Map & Entities', he: 'מפה וישויות' },
  { id: 'intel',  icon: '🧠', en: 'Intel Hub', he: 'מרכז מודיעין' },
  { id: 'analytics', icon: '📊', en: 'Engagement', he: 'מעורבות' },
];

export default function SectionNav() {
  const { lang, dir } = useLanguage();
  const [active, setActive] = useState('brief');

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
      <div className="max-w-5xl mx-auto flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide">
        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap
                         border-b-2 transition-all duration-200
                ${isActive
                  ? 'border-yellow-400 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              <span className="text-xs">{section.icon}</span>
              {lang === 'he' ? section.he : section.en}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
