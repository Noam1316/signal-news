'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
  const { dir, toggleLang, lang, ui } = useLanguage();
  const { isLight, toggleTheme } = useTheme();
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
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4
                 backdrop-blur-md border-b transition-colors
                 ${isLight
                   ? 'bg-white/95 border-gray-200'
                   : 'bg-gray-950/90 border-gray-800'
                 }`}
    >
      {/* Logo */}
      <Link
        href="/"
        className={`flex items-center gap-1.5 font-bold text-lg tracking-tight transition-colors
                    ${isLight ? 'text-gray-900' : 'text-white'}`}
      >
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
                  ? isLight ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-white'
                  : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Right side: debug link + theme toggle + language toggle */}
      <div className="flex items-center gap-2">
        <Link
          href="/rss-debug"
          className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors
                      ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
        >
          Debug
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? (lang === 'he' ? 'מצב כהה' : 'Dark mode') : (lang === 'he' ? 'מצב בהיר' : 'Light mode')}
          className={`p-1.5 rounded-md transition-colors
                      ${isLight
                        ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
        >
          {isLight ? (
            /* Moon icon */
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            /* Sun icon */
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.36-.71.71M6.34 17.66l-.71.71m12.73 0-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleLang}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors
                      ${isLight
                        ? 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500'
                        : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                      }`}
        >
          {lang === 'en' ? 'HE' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
