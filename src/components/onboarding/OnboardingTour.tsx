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
    titleHe: 'Signal News — מודיעין גיאופוליטי חי',
    titleEn: 'Signal News — Live Geopolitical Intel',
    bodyHe: 'מנתח 28+ ערוצי RSS בזמן אמת, מחלץ סיגנלים, זעזועים, ופערי נרטיב — ללא מפתח AI, הכל keyword-based.',
    bodyEn: 'Analyzes 28+ RSS feeds in real time, extracting signals, shocks, and narrative gaps — no AI key, all keyword-based.',
  },
  {
    icon: '🌡️',
    titleHe: 'מד עוצמת הסיגנל (0-10)',
    titleEn: 'Signal Intensity Gauge (0-10)',
    bodyHe: 'הגוג׳ בחלק העליון מציג את עוצמת האות הגיאופוליטי של היום. מורכב מ: לחץ סנטימנט (40%) + זעזועים פעילים (40%) + צפיפות סיגנל (20%).',
    bodyEn: 'The gauge at the top shows today\'s geopolitical signal intensity. Composed of: sentiment pressure (40%) + active shocks (40%) + signal density (20%).',
  },
  {
    icon: '📊',
    titleHe: 'ציון סבירות (Likelihood)',
    titleEn: 'Likelihood Score',
    bodyHe: 'כל סיפור מקבל ציון 0-100: מספר מקורות (30%) + עוצמת סיגנל (25%) + כיסוי ישראלי+בינלאומי (20%) + רעננות (15%) + קונסנזוס סנטימנט (10%).',
    bodyEn: 'Each story scores 0-100: source diversity (30%) + signal strength (25%) + Israeli+intl coverage (20%) + recency (15%) + sentiment consensus (10%).',
  },
  {
    icon: '🔴',
    titleHe: 'זעזועים (Shocks) — 3 סוגים',
    titleEn: 'Shocks — 3 Types',
    bodyHe: '📈 קפיצת סבירות — נפח חריג\n🗣️ פיצול נרטיב — ימין/שמאל מתארים מציאות שונה\n💥 פיצוץ כיסוי — פריצה ל-N מקורות בו-זמנית\nכל זעזוע כולל: לב המחלוקת + הסבר סטטיסטי.',
    bodyEn: '📈 Likelihood spike — unusual volume\n🗣️ Narrative split — right/left describe different reality\n💥 Coverage burst — breaking across N sources simultaneously\nEach shock includes: core of dispute + statistical explanation.',
  },
  {
    icon: '🎯',
    titleHe: 'השלכה אסטרטגית + ניגוד נרטיבים',
    titleEn: 'Strategic Implication + Narrative Split',
    bodyHe: 'כל כרטיס בריף מציג:\n🎯 "אם מסלים ←" — ההשלכה הספציפית\n📰 ניגוד נרטיבים — כותרת אמיתית מימין לצד שמאל\n🕳️ נקודות עיוורון — נושאים שנסקרים בצד אחד בלבד',
    bodyEn: 'Each brief card shows:\n🎯 "If escalates ←" — the specific implication\n📰 Narrative split — real right vs left headline\n🕳️ Blind spots — topics covered by one side only',
  },
  {
    icon: '📈',
    titleHe: 'Signal מול שוק (Polymarket)',
    titleEn: 'Signal vs Market (Polymarket)',
    bodyHe: 'השווה את הניתוח שלנו לשווקי הימורים חיים. כשיש פער בין ה-likelihood שלנו לשוק — זה alpha פוטנציאלי. ב-Intel Hub → Signal vs Market.',
    bodyEn: 'Compare our analysis to live prediction markets. When there\'s a gap between our likelihood and the market — that\'s potential alpha. In Intel Hub → Signal vs Market.',
  },
  {
    icon: '🏆',
    titleHe: 'רקורד תחזיות + הגדר התראות',
    titleEn: 'Track Record + Set Alerts',
    bodyHe: 'הצד הימני מציג את דיוק התחזיות מול baseline אקראי של 50%. לחץ 🔔 כדי להגדיר התראות זעזועים ותזכורת בוקר יומית.',
    bodyEn: 'The right column shows prediction accuracy vs a 50% random baseline. Click 🔔 to set up shock alerts and a daily morning reminder.',
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
