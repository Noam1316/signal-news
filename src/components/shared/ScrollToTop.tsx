'use client';

import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 md:bottom-10 end-4 z-40
                 w-12 h-12 rounded-full
                 bg-yellow-400/20 hover:bg-yellow-400
                 border border-yellow-400/60 hover:border-yellow-400
                 backdrop-blur-sm
                 flex items-center justify-center
                 text-yellow-400 hover:text-gray-950
                 transition-all duration-200 shadow-lg shadow-yellow-400/10
                 hover:shadow-yellow-400/30 hover:scale-110
                 animate-fade-in"
      aria-label="Scroll to top"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
