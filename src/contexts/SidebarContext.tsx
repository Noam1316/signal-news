'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export interface SidebarArticle {
  title: string;
  description: string;
  url: string;
  sourceId: string;
  sourceName: string;
  pubDate: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  signalScore: number;
  isSignal: boolean;
  impacts?: Array<{
    sector: { he: string; en: string };
    direction: 'positive' | 'negative' | 'uncertain';
  }>;
  category?: string;
  allSources?: Array<{ name: string; url: string }>;
}

interface SidebarContextType {
  open: (article: SidebarArticle) => void;
  close: () => void;
  article: SidebarArticle | null;
  isOpen: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  open: () => {},
  close: () => {},
  article: null,
  isOpen: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [article, setArticle] = useState<SidebarArticle | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((a: SidebarArticle) => {
    setArticle(a);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing article so the close animation can play
    setTimeout(() => setArticle(null), 300);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, close, article, isOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
