'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('signal-news-theme') as 'dark' | 'light' | null;
    if (stored) setTheme(stored);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('signal-news-theme', next);
    document.documentElement.classList.toggle('light-theme', next === 'light');
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 end-4 z-50 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-lg hover:bg-gray-700 transition-colors shadow-lg"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
