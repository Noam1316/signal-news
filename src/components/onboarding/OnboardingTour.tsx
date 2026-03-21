'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

const ONBOARDED_KEY = 'signal_onboarded_v1';

interface Step {
  icon: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
}

const STEPS: Step[] = [
  {
    icon: '⚡',
    titleHe: 'ברוך הבא ל-Signal News',
    titleEn: 'Welcome to Signal News',
    bodyHe: 'פלטפורמת מודיעין גיאופוליטי בזמן אמת. מנתחת 28+ מקורות RSS ומחלצת סיגנלים, זעזועים, והטיות תקשורתיות — ללא מפתח AI.',
    bodyEn: 'Real-time geopolitical intelligence. Analyzes 28+ RSS feeds and extracts signals, shocks, and media bias — no AI key needed.',
  },
  {
    icon: '📊',
    titleHe: 'ציון סבירות (Likelihood)',
    titleEn: 'Likelihood Score',
    bodyHe: 'כל סיפור מקבל ציון 0-100 המייצג כמה סביר שהאירוע יתממש. ▲ delta מראה שינוי מהמדידה הקודמת.',
    bodyEn: 'Each story gets a 0-100 score for how likely the event is to materialize. The ▲ delta shows change from the previous reading.',
  },
  {
    icon: '🔴',
    titleHe: 'זעזועים (Shocks)',
    titleEn: 'Shocks',
    bodyHe: 'שינויים סטטיסטיים חריגים: קפיצת סבירות, פיצול נרטיב, או פיצול תקשורתי. מזוהים אוטומטית מ-RSS.',
    bodyEn: 'Statistical anomalies: likelihood spike, narrative split, or media fragmentation. Auto-detected from RSS in real time.',
  },
  {
    icon: '📈',
    titleHe: 'Signal מול שוק',
    titleEn: 'Signal vs Market',
    bodyHe: 'משווה את הניתוח שלנו לשווקי ההימורים של Polymarket. כשיש פער — זה alpha פוטנציאלי.',
    bodyEn: 'Compares our analysis to Polymarket prediction markets. When there\'s a gap — that\'s potential alpha.',
  },
  {
    icon: '🎯',
    titleHe: 'הגדר התראות',
    titleEn: 'Set Up Alerts',
    bodyHe: 'לחץ על פעמון 🔔 כדי להגדיר מילות מפתח, סוגי זעזועים, ותזכורת בוקר יומית.',
    bodyEn: 'Click the 🔔 bell to configure keyword alerts, shock types, and a daily morning reminder.',
  },
];

export default function OnboardingTour() {
  const { lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      setVisible(true);
    }
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

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden
                      animate-in slide-in-from-bottom-4 duration-300">
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="text-4xl text-center">{current.icon}</div>

          {/* Title */}
          <h2 className="text-lg font-bold text-white text-center">
            {lang === 'he' ? current.titleHe : current.titleEn}
          </h2>

          {/* Body */}
          <p className="text-sm text-gray-300 text-center leading-relaxed" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            {lang === 'he' ? current.bodyHe : current.bodyEn}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-yellow-400' : 'bg-gray-700'}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {lang === 'he' ? 'דלג' : 'Skip'}
            </button>
            <button
              onClick={next}
              className="flex-1 py-2 rounded-xl bg-yellow-400 text-gray-950 text-sm font-bold hover:bg-yellow-300 transition-colors"
            >
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
