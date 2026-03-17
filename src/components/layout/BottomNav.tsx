'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/context';

const tabs = [
  {
    key: 'dailyBrief' as const,
    href: '/brief',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h5M8 16h6" />
      </svg>
    ),
  },
  {
    key: 'shockFeed' as const,
    href: '/shocks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    key: null,
    href: '#',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M16.24 7.76l-1.41 1.41M12 2v2M12 20v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M19.07 4.93l-1.41 1.41M4.93 19.07l1.41-1.41M16.24 16.24l1.41 1.41" />
      </svg>
    ),
    label: { en: 'Explore', he: 'גלה' },
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { ui, t } = useLanguage();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden
                    bg-gray-950/90 backdrop-blur-md border-t border-gray-800">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab, i) => {
          const isActive = !tab.disabled && pathname.startsWith(tab.href);
          const label = tab.key ? ui(tab.key) : tab.label ? t(tab.label) : '';

          if (tab.disabled) {
            return (
              <span
                key={i}
                className="flex flex-col items-center gap-0.5 text-gray-600 cursor-not-allowed"
              >
                {tab.icon}
                <span className="text-[10px]">{label}</span>
              </span>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 transition-colors
                ${isActive ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
