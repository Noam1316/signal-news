'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, LocalizedText } from '@/lib/types';
import { translations } from './translations';

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (text: LocalizedText) => string;
  ui: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('he');
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    const saved = localStorage.getItem('signal-news-lang') as Language;
    if (saved === 'he' || saved === 'en') {
      setLangState(saved);
    } else {
      // Default to Hebrew — primary market is Israel
      setLangState('he');
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('signal-news-lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'he' : 'en');
  }, [lang, setLang]);

  const t = useCallback((text: LocalizedText) => text[lang], [lang]);
  const ui = useCallback((key: keyof typeof translations) => translations[key][lang], [lang]);

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t, ui }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
