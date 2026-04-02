'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LiveStats {
  articles: number;
  shocks: number;
  sources: number;
  riskLevel: 'low' | 'medium' | 'high';
}

function StatCounter({ value, label, color }: { value: number | null; label: string; color: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === null) return;
    const step = Math.ceil(value / 40);
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplayed(cur);
      if (cur >= value) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${color}`}>
        {value === null ? '—' : displayed.toLocaleString()}
      </span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

const FEATURES = [
  {
    icon: '🌡️',
    titleHe: 'מד עוצמת סיגנל',
    titleEn: 'Signal Intensity Gauge',
    bodyHe: 'ציון 0-10 גיאופוליטי חי, מסנטימנט + זעזועים + צפיפות כיסוי.',
    bodyEn: 'Live 0-10 geopolitical score from sentiment + shocks + coverage density.',
  },
  {
    icon: '⚡',
    titleHe: 'זיהוי זעזועים אוטומטי',
    titleEn: 'Automatic Shock Detection',
    bodyHe: 'קפיצות סבירות, פיצולי נרטיב ופיצוץ כיסוי — מזוהים סטטיסטית מ-RSS.',
    bodyEn: 'Likelihood spikes, narrative splits, coverage bursts — statistically detected from RSS.',
  },
  {
    icon: '📈',
    titleHe: 'Signal מול Polymarket',
    titleEn: 'Signal vs Polymarket',
    bodyHe: 'השוואה לשווקי הימורים חיים — פערים הם alpha פוטנציאלי.',
    bodyEn: 'Compared against live prediction markets — gaps represent potential alpha.',
  },
  {
    icon: '🗣️',
    titleHe: 'ניתוח הטיה תקשורתית',
    titleEn: 'Media Bias Analysis',
    bodyHe: '35+ מקורות ממופים. פערי כיסוי, פיצולי נרטיב, נקודות עיוורון.',
    bodyEn: '35+ sources mapped. Coverage gaps, narrative splits, blind spots surfaced.',
  },
  {
    icon: '🎯',
    titleHe: 'השלכות אסטרטגיות',
    titleEn: 'Strategic Implications',
    bodyHe: 'לכל נושא — "אם מסלים ←" תוצאה ספציפית. ללא AI, keyword-based.',
    bodyEn: 'Per topic — "if escalates ←" specific outcome. No AI, keyword-based.',
  },
  {
    icon: '🏆',
    titleHe: 'רקורד תחזיות',
    titleEn: 'Prediction Track Record',
    bodyHe: 'דיוק מול baseline אקראי של 50%. שקיפות מלאה — ניצחונות וטעויות.',
    bodyEn: 'Accuracy vs random 50% baseline. Full transparency — wins and misses.',
  },
];

const RISK_LABEL: Record<string, { he: string; en: string; color: string }> = {
  low:    { he: 'סיכון נמוך',    en: 'Low Risk',    color: 'text-emerald-400' },
  medium: { he: 'סיכון בינוני', en: 'Medium Risk', color: 'text-amber-400'   },
  high:   { he: 'סיכון גבוה',   en: 'High Risk',   color: 'text-red-400'     },
};

export default function LandingPage() {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('signal_lang') as 'he' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.allSettled([fetch('/api/analyze'), fetch('/api/shocks')])
      .then(([aRes, sRes]) => {
        let articles = 0, sources = 28, shocks = 0, riskIndex = 0;
        if (aRes.status === 'fulfilled' && aRes.value.ok) {
          aRes.value.json().then(d => {
            articles = d?.stats?.total ?? 0;
            sources  = d?.stats?.sources ?? 28;
            const sent  = d?.stats?.sentimentBreakdown ?? {};
            const total = Object.values(sent).reduce((a: number, b) => a + (b as number), 0) as number;
            const negR  = total > 0 ? (sent.negative ?? 0) / total : 0.4;
            riskIndex += negR * 40;
          }).catch(() => {});
        }
        if (sRes.status === 'fulfilled' && sRes.value.ok) {
          sRes.value.json().then(d => {
            const list = d?.shocks ?? [];
            shocks = list.length;
            const p = list.reduce((a: number, s: any) =>
              a + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4), 0);
            riskIndex += Math.min(40, p);
            const level: 'low' | 'medium' | 'high' = riskIndex >= 66 ? 'high' : riskIndex >= 34 ? 'medium' : 'low';
            setStats({ articles, shocks, sources, riskLevel: level });
          }).catch(() => {});
        } else {
          setStats({ articles, shocks, sources, riskLevel: 'low' });
        }
      });
  }, []);

  const toggleLang = () => {
    const next = lang === 'he' ? 'en' : 'he';
    setLang(next);
    localStorage.setItem('signal_lang', next);
  };

  const risk = stats ? RISK_LABEL[stats.riskLevel] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'he' ? 'rtl' : 'ltr'}>

      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-yellow-400">⚡</span>
          <span>Signal News</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang}
            className="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
            {lang === 'he' ? 'EN' : 'HE'}
          </button>
          <Link href="/dashboard"
            className="px-4 py-1.5 rounded-lg bg-yellow-400 text-gray-950 text-sm font-bold hover:bg-yellow-300 transition-colors">
            {lang === 'he' ? 'כנס ←' : 'Enter →'}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${pulse ? 'opacity-100' : 'opacity-30'} transition-opacity duration-1000`} />
          {lang === 'he' ? 'מנטר 28+ מקורות RSS עכשיו' : 'Monitoring 28+ RSS sources now'}
          {risk && (
            <span className={`ms-2 font-bold ${risk.color}`}>
              · {lang === 'he' ? risk.he : risk.en}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
          {lang === 'he'
            ? <>מודיעין גיאופוליטי<br /><span className="text-yellow-400">בזמן אמת</span></>
            : <>Geopolitical Intelligence<br /><span className="text-yellow-400">in Real Time</span></>}
        </h1>

        {/* Sub */}
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          {lang === 'he'
            ? 'מנתח RSS, מחלץ זעזועים, משווה לשווקי הימורים וזוהה פערי נרטיב — ללא מפתח AI.'
            : 'Analyzes RSS, extracts shocks, compares to prediction markets, and surfaces narrative gaps — no AI key.'}
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-yellow-400 text-gray-950 font-bold text-base hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20">
            <span>⚡</span>
            {lang === 'he' ? 'כנס לדשבורד' : 'Open Dashboard'}
            <span>{lang === 'he' ? '←' : '→'}</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('signal_onboarded_v2');
              window.location.href = '/dashboard';
            }}
            className="px-6 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-medium text-sm hover:border-gray-500 hover:text-white transition-colors">
            🎯 {lang === 'he' ? 'סיור הדגמה' : 'Demo Tour'}
          </button>
        </div>
      </div>

      {/* Live stats */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-3 gap-6 p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
          <StatCounter
            value={stats?.articles ?? null}
            label={lang === 'he' ? 'כתבות מנוטרות עכשיו' : 'Articles monitored now'}
            color="text-white"
          />
          <StatCounter
            value={stats?.shocks ?? null}
            label={lang === 'he' ? 'זעזועים פעילים' : 'Active shocks'}
            color="text-yellow-400"
          />
          <StatCounter
            value={stats?.sources ?? 28}
            label={lang === 'he' ? 'מקורות מחוברים' : 'Sources connected'}
            color="text-emerald-400"
          />
        </div>
      </div>

      {/* Feature grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
          {lang === 'he' ? 'מה Signal מוסיף מעבר לחדשות רגילות' : 'What Signal adds beyond regular news'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 hover:border-gray-700 transition-colors">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'he' ? f.titleHe : f.titleEn}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {lang === 'he' ? f.bodyHe : f.bodyEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-gray-800 py-12 text-center space-y-4">
        <p className="text-gray-500 text-sm">
          {lang === 'he'
            ? 'פלטפורמת דמו — מיזם מעוף | נבנה עם Next.js + TypeScript + Tailwind'
            : 'Demo platform — Maof Project | Built with Next.js + TypeScript + Tailwind'}
        </p>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-yellow-400/40 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/10 transition-colors">
          {lang === 'he' ? 'כנס לדשבורד ←' : 'Open Dashboard →'}
        </Link>
      </div>
    </div>
  );
}
