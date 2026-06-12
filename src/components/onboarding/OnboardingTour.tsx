'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

const ONBOARDED_KEY = 'signal_onboarded_v2';

interface Step {
  icon: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  highlight?: string; // CSS selector to spotlight (optional)
}

const STEPS: Step[] = [
  {
    icon: '⚡',
    titleHe: 'Zikuk — מודיעין גיאופוליטי חי',
    titleEn: 'Zikuk — Live Geopolitical Intel',
    bodyHe: 'מנתח 50+ ערוצי RSS בזמן אמת — מחלץ סיגנלים, זעזועים ופערי נרטיב. ללא מפתח AI, הכל keyword-based.\n\nגלול מטה לראות Brief (סיפורים), Shocks (אנומליות), ו-Intel Hub (ניתוח מעמיק).',
    bodyEn: 'Analyzes 50+ RSS feeds in real time — extracting signals, shocks, and narrative gaps. No AI key needed, all keyword-based.\n\nScroll down to see Brief (stories), Shocks (anomalies), and Intel Hub (deep analysis).',
  },
  {
    icon: '📊',
    titleHe: 'מדד סיגנל — לא הסתברות',
    titleEn: 'Signal Index — Not Probability',
    bodyHe: 'המספר על כל כרטיס (0-100) מודד עוצמת כיסוי ואימות — לא כמה סביר שהאירוע יקרה.\n\nלחץ על המדד לפירוק מלא: אימות מקורות (30) + עוצמת סיגנל (25) + רוחב כיסוי (20) + רעננות (15) + קונסנזוס (10).',
    bodyEn: 'The number on each card (0-100) measures coverage & verification intensity — not how likely the event is to happen.\n\nClick the meter for a full breakdown: verification (30) + strength (25) + breadth (20) + freshness (15) + consensus (10).',
  },
  {
    icon: '🟡',
    titleHe: 'Signal מול שוק — מומנטום',
    titleEn: 'Signal vs Market — Momentum',
    bodyHe: 'ב-Intel Hub → Signal vs Market: אנחנו לא משווים מספרים (סולמות שונים), אלא **כיוון שינוי**.\n\n🟡 הכיסוי מקדים — השוק עוד לא הגיב\n✅ מאומת — שניהם זזים יחד\n⚠️ כיוונים מנוגדים — אחד טועה',
    bodyEn: 'In Intel Hub → Signal vs Market: we don\'t compare numbers (different scales), we compare **direction of change**.\n\n🟡 Coverage leads — market hasn\'t reacted yet\n✅ Confirmed — both moving together\n⚠️ Diverging — one side is wrong',
  },
];

export default function OnboardingTour() {
  const { lang } = useLanguage();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show on first visit
    if (!localStorage.getItem(ONBOARDED_KEY)) setVisible(true);

    // Also listen for manual trigger
    const handler = () => { setStep(0); setVisible(true); };
    window.addEventListener('signal:start-tour', handler);
    return () => window.removeEventListener('signal:start-tour', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const title   = lang === 'he' ? current.titleHe : current.titleEn;
  // Split body on \n for line breaks
  const bodyLines = (lang === 'he' ? current.bodyHe : current.bodyEn).split('\n');

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden
                      animate-in slide-in-from-bottom-4 duration-300">
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800">
          <div className="h-full bg-yellow-400 transition-all duration-300"
               style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className="p-6 space-y-4">
          <div className="text-4xl text-center">{current.icon}</div>

          <h2 className="text-base font-bold text-white text-center leading-snug">
            {title}
          </h2>

          <div className="space-y-1" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            {bodyLines.map((line, i) => (
              <p key={i} className="text-sm text-gray-300 leading-relaxed">
                {line}
              </p>
            ))}
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">{step + 1} / {STEPS.length}</span>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-yellow-400' : 'bg-gray-700'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={dismiss}
              className="flex-1 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-gray-200 transition-colors">
              {lang === 'he' ? 'דלג' : 'Skip'}
            </button>
            <button onClick={next}
              className="flex-1 py-2 rounded-xl bg-yellow-400 text-gray-950 text-sm font-bold hover:bg-yellow-300 transition-colors">
              {step < STEPS.length - 1
                ? (lang === 'he' ? 'הבא ←' : 'Next →')
                : (lang === 'he' ? 'בואו נתחיל! 🚀' : 'Let\'s go! 🚀')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
