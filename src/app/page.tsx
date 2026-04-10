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
    icon: '🔴',
    titleHe: 'התראות שבירה בזמן אמת',
    titleEn: 'Real-Time Breaking Alerts',
    bodyHe: 'בנר אוטומטי לסיפורים חמים — סבירות גבוהה + גיל פחות מ-3 שעות.',
    bodyEn: 'Auto banner for hot stories — high likelihood + under 3 hours old.',
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
    bodyHe: '43+ מקורות ממופים. פערי כיסוי, פיצולי נרטיב, נקודות עיוורון.',
    bodyEn: '43+ sources mapped. Coverage gaps, narrative splits, blind spots surfaced.',
  },
  {
    icon: '🧠',
    titleHe: 'NLP עברי עם Groq',
    titleEn: 'Hebrew NLP via Groq',
    bodyHe: 'ניתוח LLaMA 3.3 70B לכתבות — נושאים מדויקים, סנטימנט, וסיכומים בעברית.',
    bodyEn: 'LLaMA 3.3 70B analysis per article — accurate topics, sentiment, Hebrew summaries.',
  },
  {
    icon: '🏷️',
    titleHe: 'עמודי נושא חיים',
    titleEn: 'Live Topic Pages',
    bodyHe: 'לחיצה על נושא → כל הסיפורים הפעילים בנושא זה, ממויינים לפי חשיבות.',
    bodyEn: 'Click any topic → all active stories on that topic, ranked by importance.',
  },
  {
    icon: '🎯',
    titleHe: 'השלכות אסטרטגיות',
    titleEn: 'Strategic Implications',
    bodyHe: 'לכל סיפור — השפעה על שוק הנפט, המט"ח, הביטחון האזורי ועוד.',
    bodyEn: 'Per story — impact on oil, forex, regional security and more.',
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

const USE_CASES = [
  { icon: '🏦', he: 'קרנות גידור', en: 'Hedge Funds', descHe: 'alpha גיאופוליטי לפני השוק', descEn: 'Geopolitical alpha before the market' },
  { icon: '🎖️', he: 'מומחי ביטחון', en: 'Security Analysts', descHe: 'מודיעין מוקדם בזמן אמת', descEn: 'Early warning intelligence in real-time' },
  { icon: '📰', he: 'עיתונאים', en: 'Journalists', descHe: 'פערי נרטיב וזיהוי סיפורים עולים', descEn: 'Narrative gaps & emerging story detection' },
  { icon: '🏛️', he: 'ממשלות וNGOs', en: 'Governments & NGOs', descHe: 'ניתוח מדיניות מבוסס נתונים', descEn: 'Data-driven policy analysis' },
];

export default function LandingPage() {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [pulse, setPulse] = useState(true);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem('signal_lang') as 'he' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.allSettled([fetch('/api/analyze'), fetch('/api/shocks'), fetch('/api/track-record')])
      .then(([aRes, sRes, tRes]) => {
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
            const p = list.reduce((a: number, s: { confidence: string }) =>
              a + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4), 0);
            riskIndex += Math.min(40, p);
            const level: 'low' | 'medium' | 'high' = riskIndex >= 66 ? 'high' : riskIndex >= 34 ? 'medium' : 'low';
            setStats({ articles, shocks, sources, riskLevel: level });
          }).catch(() => {});
        } else {
          setStats({ articles, shocks, sources, riskLevel: 'low' });
        }
        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          tRes.value.json().then(d => {
            setAccuracy(d?.accuracyRate ?? d?.signalWinRate ?? null);
          }).catch(() => {});
        }
      });
  }, []);

  const toggleLang = () => {
    const next = lang === 'he' ? 'en' : 'he';
    setLang(next);
    localStorage.setItem('signal_lang', next);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dailyBrief: true, topics: [], watchlistAlerts: false }),
      });
      setSubState(res.ok ? 'done' : 'error');
    } catch { setSubState('error'); }
  };

  const risk = stats ? RISK_LABEL[stats.riskLevel] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'he' ? 'rtl' : 'ltr'}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-yellow-400">⚡</span>
          <span>Zikuk</span>
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
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center space-y-6">

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${pulse ? 'opacity-100' : 'opacity-30'} transition-opacity duration-1000`} />
          {lang === 'he' ? 'מנטר 43+ מקורות RSS עכשיו' : 'Monitoring 43+ RSS sources now'}
          {risk && (
            <span className={`ms-2 font-bold ${risk.color}`}>
              · {lang === 'he' ? risk.he : risk.en}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
          {lang === 'he'
            ? <>מודיעין גיאופוליטי<br /><span className="text-yellow-400">לפני השוק</span></>
            : <>Geopolitical Intelligence<br /><span className="text-yellow-400">Before the Market</span></>}
        </h1>

        {/* Sub */}
        <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
          {lang === 'he'
            ? 'מנתח 43+ מקורות עברית ואנגלית, מזהה שבירות בזמן אמת, ומשווה לשווקי הימורים — כולל NLP בעברית.'
            : 'Analyzes 43+ Hebrew & English sources, detects breaking news in real-time, and compares against prediction markets — including Hebrew NLP.'}
        </p>

        {/* Accuracy badge */}
        {accuracy !== null && (
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-yellow-400/25 bg-yellow-400/5">
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-400 font-mono">{accuracy}%</div>
              <div className="text-[10px] text-gray-500">
                {lang === 'he' ? 'דיוק תחזיות' : 'prediction accuracy'}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400 font-mono">+{Math.max(0, accuracy - 50)}%</div>
              <div className="text-[10px] text-gray-500">
                {lang === 'he' ? 'מעל baseline אקראי' : 'above random baseline'}
              </div>
            </div>
          </div>
        )}

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

      {/* Who uses this */}
      <div className="max-w-4xl mx-auto px-6 pb-14">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
          {lang === 'he' ? 'מי משתמש ב-Signal' : 'Who uses Signal'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {USE_CASES.map((u, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-center space-y-2 hover:border-gray-700 transition-colors">
              <div className="text-2xl">{u.icon}</div>
              <h3 className="text-sm font-bold text-white">{lang === 'he' ? u.he : u.en}</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">{lang === 'he' ? u.descHe : u.descEn}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
          {lang === 'he' ? 'מה Signal מוסיף מעבר לחדשות רגילות' : 'What Signal adds beyond regular news'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Email subscribe section */}
      <div className="border-t border-gray-800 py-14">
        <div className="max-w-md mx-auto px-6 text-center space-y-4">
          <div className="text-2xl">📬</div>
          <h2 className="text-xl font-black">
            {lang === 'he' ? 'תקציר מודיעיני כל בוקר ב-7:00' : 'Intelligence brief every morning at 7am'}
          </h2>
          <p className="text-sm text-gray-400">
            {lang === 'he'
              ? 'הזעזועים המובילים, סיגנל מול שוק, ופערי נרטיב — ישר לתיבה.'
              : 'Top shocks, signal vs market, narrative gaps — straight to your inbox.'}
          </p>

          {subState === 'done' ? (
            <div className="py-4 text-emerald-400 font-bold">
              ✅ {lang === 'he' ? 'נרשמת! תקציר ראשון מחר בבוקר.' : 'Subscribed! First brief tomorrow morning.'}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2" dir="ltr">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
              />
              <button
                type="submit"
                disabled={subState === 'loading'}
                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-gray-950 font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {subState === 'loading' ? '...' : lang === 'he' ? 'הירשם' : 'Subscribe'}
              </button>
            </form>
          )}
          {subState === 'error' && (
            <p className="text-red-400 text-xs">{lang === 'he' ? 'שגיאה, נסה שוב.' : 'Error, please try again.'}</p>
          )}
          <p className="text-[11px] text-gray-600">
            {lang === 'he' ? 'ללא ספאם. ביטול בכל עת.' : 'No spam. Unsubscribe anytime.'}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 py-8 text-center space-y-3">
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
