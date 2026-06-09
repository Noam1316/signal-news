'use client';

import { useEffect, useCallback, useState } from 'react';

interface UseKeyboardNavOptions {
  count: number;
  onExpand?: (idx: number) => void;
  onWatch?: (idx: number) => void;
  onOpenSource?: (idx: number) => void;
  enabled?: boolean;
}

export function useKeyboardNav({
  count,
  onExpand,
  onWatch,
  onOpenSource,
  enabled = true,
}: UseKeyboardNavOptions) {
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

  const scrollToCard = useCallback((idx: number) => {
    const el = document.querySelector(`[data-card-idx="${idx}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't hijack when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'j':
        case 'J':
          e.preventDefault();
          setFocusedIdx(prev => {
            const next = Math.min(prev + 1, count - 1);
            scrollToCard(next);
            return next;
          });
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          setFocusedIdx(prev => {
            const next = Math.max(prev - 1, 0);
            scrollToCard(next);
            return next;
          });
          break;
        case 'Enter':
          if (focusedIdx >= 0) { e.preventDefault(); onExpand?.(focusedIdx); }
          break;
        case 'w':
        case 'W':
          if (focusedIdx >= 0) { e.preventDefault(); onWatch?.(focusedIdx); }
          break;
        case 'o':
        case 'O':
          if (focusedIdx >= 0) { e.preventDefault(); onOpenSource?.(focusedIdx); }
          break;
        case 'Escape':
          setFocusedIdx(-1);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, count, focusedIdx, onExpand, onWatch, onOpenSource, scrollToCard]);

  return { focusedIdx, setFocusedIdx };
}
