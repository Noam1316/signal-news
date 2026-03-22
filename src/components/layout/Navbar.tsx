'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
  const { dir, toggleLang, lang, ui } = useLanguage();
  const { isLight, toggleTheme } = useTheme();

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
      {/* Logo → home */}
      <Link
        href="/"
        className={`flex items-center gap-1.5 font-bold text-lg tracking-tight transition-colors
                    ${isLight ? 'text-gray-900' : 'text-white'}`}
      >
        <span className="text-yellow-400">&#9889;</span>
        <span>{ui('appName')}</span>
      </Link>

      {/* Center: Dashboard link only */}
      <Link
        href="/dashboard"
        className={`hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isLight
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-gray-800/80 text-gray-200 hover:bg-gray-700'
                    }`}
      >
        <span className="text-yellow-400 text-xs">⚡</span>
        {lang === 'he' ? 'דשבורד' : 'Dashboard'}
      </Link>

      {/* Right side: theme toggle + language toggle + debug */}
      <div className="flex items-center gap-2">
        <Link
          href="/rss-debug"
          className={`hidden md:inline px-2 py-1 rounded-md text-[10px] font-mono transition-colors
                      ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
        >
          Debug
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? (lang === 'he' ? 'מצב כהה' : 'Dark mode') : (lang === 'he' ? 'מצב בהיר' : 'Light mode')}
          aria-label={isLight ? (lang === 'he' ? 'מצב כהה' : 'Dark mode') : (lang === 'he' ? 'מצב בהיר' : 'Light mode')}
          className={`p-1.5 rounded-md transition-colors
                      ${isLight
                        ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
        >
          {isLight ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.36-.71.71M6.34 17.66l-.71.71m12.73 0-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleLang}
          aria-label={lang === 'en' ? 'Switch to Hebrew' : 'עבור לאנגלית'}
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
