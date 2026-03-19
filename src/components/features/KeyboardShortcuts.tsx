'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';

const SHORTCUTS = [
  { keys: '1', action: 'Go to Brief', actionHe: 'מעבר לתקציר', section: 'brief' },
  { keys: '2', action: 'Go to Shocks', actionHe: 'מעבר לזעזועים', section: 'shocks' },
  { keys: '3', action: 'Go to Map', actionHe: 'מעבר למפה', section: 'map' },
  { keys: '4', action: 'Go to Intel Hub', actionHe: 'מעבר למודיעין', section: 'intel' },
  { keys: '5', action: 'Go to Analytics', actionHe: 'מעבר למעורבות', section: 'analytics' },
  { keys: '6', action: 'Go to Features', actionHe: 'מעבר לפיצ\'רים', section: 'features' },
  { keys: 'T', action: 'Toggle theme', actionHe: 'החלף ערכת צבעים', section: null },
  { keys: 'L', action: 'Toggle language', actionHe: 'החלף שפה', section: null },
  { keys: '?', action: 'Show shortcuts', actionHe: 'הצג קיצורים', section: null },
  { keys: 'Esc', action: 'Close panel', actionHe: 'סגור חלון', section: null },
];

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case '1': case '2': case '3': case '4': case '5': case '6': {
          const section = SHORTCUTS.find(s => s.keys === e.key)?.section;
          if (section) {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          break;
        }
        case 't': case 'T':
          document.documentElement.classList.toggle('light-theme');
          break;
        case '?':
          setShowHelp(prev => !prev);
          break;
        case 'Escape':
          setShowHelp(false);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return { showHelp, setShowHelp };
}

export default function KeyboardShortcutsPanel() {
  const { lang } = useLanguage();

  return (
    <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        ⌨️ {lang === 'he' ? 'קיצורי מקלדת' : 'Keyboard Shortcuts'}
      </h3>
      <p className="text-[10px] text-gray-500">
        {lang === 'he' ? 'לחץ ? בכל עמוד לפתיחת חלון זה' : 'Press ? on any page to show this panel'}
      </p>
      <div className="space-y-1">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center gap-3 py-1.5">
            <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono text-yellow-400 min-w-[32px] text-center">
              {s.keys}
            </kbd>
            <span className="text-xs text-gray-400">
              {lang === 'he' ? s.actionHe : s.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">⌨️ {lang === 'he' ? 'קיצורים' : 'Shortcuts'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center gap-3">
              <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono text-yellow-400 min-w-[32px] text-center">
                {s.keys}
              </kbd>
              <span className="text-xs text-gray-400">{lang === 'he' ? s.actionHe : s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
