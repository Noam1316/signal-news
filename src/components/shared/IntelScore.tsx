'use client';

import { useLanguage } from '@/i18n/context';
import { useIntelScore } from '@/hooks/useIntelScore';

const LEVEL_CONFIG = {
  newcomer: { he: 'חדש', en: 'Newcomer', icon: '🌱', color: 'text-gray-400' },
  reader: { he: 'קורא', en: 'Reader', icon: '📰', color: 'text-blue-400' },
  analyst: { he: 'אנליסט', en: 'Analyst', icon: '🔍', color: 'text-yellow-400' },
  expert: { he: 'מומחה', en: 'Expert', icon: '🏆', color: 'text-emerald-400' },
};

export default function IntelScore() {
  const { lang } = useLanguage();
  const { score, streak, level, storiesViewed, shocksViewed } = useIntelScore();
  const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];

  return (
    <div className="flex items-center gap-2" title={
      lang === 'he'
        ? `ציון יומי: ${score}/100 | סיפורים: ${storiesViewed} | זעזועים: ${shocksViewed}`
        : `Daily score: ${score}/100 | Stories: ${storiesViewed} | Shocks: ${shocksViewed}`
    }>
      {/* Score ring */}
      <div className="relative w-7 h-7">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-800" />
          <circle
            cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" strokeWidth="3"
            className={config.color}
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
          {score}
        </span>
      </div>

      {/* Streak */}
      {streak > 1 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-medium">
          🔥 {streak}{lang === 'he' ? 'י' : 'd'}
        </span>
      )}

      {/* Level */}
      <span className={`text-[10px] font-medium hidden sm:inline ${config.color}`}>
        {config.icon} {lang === 'he' ? config.he : config.en}
      </span>
    </div>
  );
}
