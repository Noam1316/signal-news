'use client';

import { useLanguage } from '@/i18n/context';

const SECTIONS = [
  {
    id: 'brief', heLabel: 'תקציר', enLabel: 'Brief',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h5M8 16h6" />
      </svg>
    ),
  },
  {
    id: 'shocks', heLabel: 'זעזועים', enLabel: 'Shocks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'map', heLabel: 'מפה', enLabel: 'Map',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 'intel', heLabel: 'מודיעין', enLabel: 'Intel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a8 8 0 0 0-8 8c0 3.37 2.1 6.27 5 7.42V20h6v-2.58c2.9-1.15 5-4.05 5-7.42a8 8 0 0 0-8-8z" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { lang } = useLanguage();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-950/95 backdrop-blur-md border-t border-gray-800">
      <div className="flex items-center justify-around h-14">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-yellow-400 transition-colors active:scale-95"
          >
            {s.icon}
            <span className="text-[10px] font-medium">
              {lang === 'he' ? s.heLabel : s.enLabel}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
