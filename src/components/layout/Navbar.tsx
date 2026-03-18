'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/context';

export default function Navbar() {
  const { dir, toggleLang, lang, ui } = useLanguage();
  const pathname = usePathname();

  const tabs = [
    { label: lang === 'he' ? '📋 דשבורד' : '📋 Dashboard', href: '/dashboard' },
    { label: ui('dailyBrief'), href: '/brief' },
    { label: ui('shockFeed'), href: '/shocks' },
    { label: ui('explore'), href: '/explore' },
    { label: ui('intel'), href: '/intel' },
  ];

  return (
    <nav
      dir={dir}
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4
                 bg-gray-950/90 backdrop-blur-md border-b border-gray-800"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1.5 text-white font-bold text-lg tracking-tight">
        <span className="text-yellow-400">&#9889;</span>
        <span>{ui('appName')}</span>
      </Link>

      {/* Desktop nav tabs */}
      <div className="hidden md:flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Right side: debug link + language toggle */}
      <div className="flex items-center gap-2">
        <Link
          href="/rss-debug"
          className="px-2 py-1 rounded-md text-[10px] font-mono text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
        >
          Debug
        </Link>
        <button
          onClick={toggleLang}
          className="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-700
                     text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
        >
          {lang === 'en' ? 'HE' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
