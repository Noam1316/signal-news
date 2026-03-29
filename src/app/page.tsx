'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/context';

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

const STATS = [
  { value: '38+', labelHe: 'מקורות חדשות', labelEn: 'News Sources' },
  { value: '<5s', labelHe: 'זמן עדכון', labelEn: 'Update Cycle' },
  { value: '50+', labelHe: 'שווקי Polymarket', labelEn: 'Live Markets' },
  { value: '0₪', labelHe: 'עלות API', labelEn: 'API Cost' },
];

const TECH_PILLARS = [
  {
    icon: '📡',
    color: '#6366f1',
    bg: '#1e1b4b',
    titleHe: 'איסוף ועיבוד',
    titleEn: 'Ingestion',
    descHe: '38+ RSS feeds → dedup → keyword analysis — ללא LLM, ללא API key',
    descEn: '38+ RSS feeds → dedup → keyword analysis — no LLM, no API key',
  },
  {
    icon: '🔍',
    color: '#22c55e',
    bg: '#052e16',
    titleHe: 'קלסטרינג חכם',
    titleEn: 'Smart Clustering',
    descHe: 'מאמרים מקובצים לסיפורים לפי נושא, ישות וזמן. ציון likelihood לכל סיפור.',
    descEn: 'Articles grouped into stories by topic, entity and time. Per-story likelihood score.',
  },
  {
    icon: '⚡',
    color: '#f59e0b',
    bg: '#1c1007',
    titleHe: 'Shock Detection',
    titleEn: 'Shock Detection',
    descHe: 'זיהוי סטטיסטי של שינויים חריגים: likelihood shocks, narrative splits, fragmentation.',
    descEn: 'Statistical anomaly detection: likelihood shocks, narrative splits, fragmentation.',
  },
  {
    icon: '📈',
    color: '#a78bfa',
    bg: '#1a0533',
    titleHe: 'Signal vs Market',
    titleEn: 'Signal vs Market',
    descHe: 'השוואה לשווקי Polymarket — Alpha Score מזהה פערים בין תחזית ה-AI לשוק ההימורים.',
    descEn: 'Compare with Polymarket odds — Alpha Score finds gaps between AI forecast and market.',
  },
];

const USE_CASES = [
  { emoji: '🏛️', titleHe: 'מקבלי החלטות', titleEn: 'Decision Makers', descHe: 'מודיעין מדיני גאו-פוליטי בזמן אמת — בלי לעבור 200 כתבות ביום', descEn: 'Real-time geo-political intelligence without reading 200 articles/day' },
  { emoji: '💹', titleHe: 'אנליסטים ומשקיעים', titleEn: 'Analysts & Investors', descHe: 'זיהוי אירועים לפני שהשוק מתמחר אותם — Alpha מול Polymarket', descEn: 'Spot events before markets price them in — Alpha vs Polymarket' },
  { emoji: '🎓', titleHe: 'מחקר ואקדמיה', titleEn: 'Research', descHe: 'ניתוח הטיה תקשורתית, narrative divergence, ו-entity co-occurrence', descEn: 'Media bias analysis, narrative divergence, entity co-occurrence' },
];

export default function LandingPage() {
  const { lang, dir, toggleLang } = useLanguage();
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, dailyBrief: true }),
      });
      setEmailSubmitted(true);
    } catch { /* silent */ } finally { setEmailLoading(false); }
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#060a14] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-6 bg-[#060a14]/90 backdrop-blur-md border-b border-gray-800/60">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-yellow-400">⚡</span>
          <span>Signal News</span>
          <span className="hidden sm:inline text-[10px] font-normal text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 ml-1">
            {lang === 'he' ? 'בטא' : 'beta'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-gray-950 text-sm font-bold hover:bg-yellow-300 transition-colors">
            {lang === 'he' ? 'פתח דמו חי' : 'Live Demo'}
            <span className={lang === 'he' ? 'rotate-180 inline-block' : ''}>→</span>
          </Link>
          <button onClick={toggleLang} className="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-700 text-gray-400 hover:text-white transition-colors">
            {lang === 'he' ? 'EN' : 'HE'}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-[#0a1020] to-[#060a14] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {lang === 'he' ? 'פלטפורמת מודיעין גאו-פוליטי בזמן אמת' : 'Real-time geopolitical intelligence platform'}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight">
            {lang === 'he' ? (
              <>
                <span className="text-white">דע מה </span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">צפוי להתרחש</span>
                <br />
                <span className="text-white">לפני השוק</span>
              </>
            ) : (
              <>
                <span className="text-white">Know what&apos;s </span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">likely next</span>
                <br />
                <span className="text-white">before the market</span>
              </>
            )}
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {lang === 'he'
              ? 'מנוע AI שמנתח 38+ מקורות חדשות בעברית ואנגלית, מזהה זעזועים סטטיסטיים, ומשווה לשוקי Polymarket — הכל ללא מפתח API.'
              : 'AI engine analyzing 38+ news sources in Hebrew & English, detects statistical shocks, and compares with Polymarket odds — zero API key needed.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-gray-950 font-bold text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg shadow-yellow-400/20"
            >
              {lang === 'he' ? 'פתח דמו חי' : 'Open Live Demo'}
              <span className={lang === 'he' ? 'rotate-180 inline-block' : ''}>→</span>
            </Link>
            <a
              href="https://github.com/Noam1316/signal-news"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </a>
          </div>

          {/* Social proof */}
          <p className="text-xs text-gray-600">
            {lang === 'he' ? 'דמו חי · ממשק בעברית · RTL-first · מעודכן כל 5 דקות' : 'Live demo · Hebrew UI · RTL-first · Updated every 5 minutes'}
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-gray-800/50 py-12 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <Reveal key={s.value} delay={i * 80}>
              <div className="text-4xl font-black text-yellow-400">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{lang === 'he' ? s.labelHe : s.labelEn}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 space-y-3">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                {lang === 'he' ? 'הבעיה שאנחנו פותרים' : 'The problem we solve'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {lang === 'he' ? 'רעש לא ייצר החלטות. Signal כן.' : 'Noise doesn\'t make decisions. Signal does.'}
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                {lang === 'he'
                  ? 'כלי מודיעין קיימים דורשים מנויים יקרים, ידע מוקדם, או מפתחות API של אלפי דולרים. Signal News מוכיח שאפשר לעשות את זה טוב יותר — בפתוח, בעברית, ללא עלות AI.'
                  : 'Existing intelligence tools demand expensive subscriptions, domain expertise, or $1,000s in API keys. Signal News proves you can do it better — open, in Hebrew, zero AI cost.'}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '😰',
                titleHe: 'עומס מידע',
                titleEn: 'Information Overload',
                descHe: '200+ כתבות ביום מ-38 מקורות — אי אפשר לקרוא הכל. מי שחושב שהוא מפספס משהו — צודק.',
                descEn: '200+ articles/day from 38 sources — impossible to read all. Anyone thinking they miss something — is right.',
              },
              {
                icon: '🎯',
                titleHe: 'Signal = פתרון',
                titleEn: 'Signal = Solution',
                descHe: 'קלסטרינג חכם מקבץ כתבות לסיפורים. ציון likelihood מדרג חשיבות. זעזועים מזוהים אוטומטית.',
                descEn: 'Smart clustering groups articles into stories. Likelihood score ranks importance. Shocks detected automatically.',
              },
              {
                icon: '💡',
                titleHe: 'ייחודיות טכנית',
                titleEn: 'Tech Differentiation',
                descHe: 'keyword-based analysis ללא LLM. פועל ב-Vercel serverless. עלות: $0/חודש. מהירות: <5 שניות.',
                descEn: 'Keyword-based analysis, no LLM. Runs on Vercel serverless. Cost: $0/month. Speed: <5 seconds.',
              },
            ].map((c, i) => (
              <Reveal key={c.icon} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3 h-full">
                  <div className="text-3xl">{c.icon}</div>
                  <h3 className="text-lg font-bold text-white">{lang === 'he' ? c.titleHe : c.titleEn}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{lang === 'he' ? c.descHe : c.descEn}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="py-24 px-6 bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 space-y-3">
              <p className="text-xs uppercase tracking-widest text-yellow-400 font-semibold">
                {lang === 'he' ? 'ארכיטקטורה' : 'Architecture'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {lang === 'he' ? 'איך זה עובד' : 'How it works'}
              </h2>
              <div className="text-sm text-gray-500 font-mono">
                RSS (38+) → article-cache → ai-analyzer → story-clusterer → shock-detector → polymarket matcher
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TECH_PILLARS.map((p, i) => (
              <Reveal key={p.icon} delay={i * 80}>
                <div className="flex gap-4 p-5 rounded-2xl border h-full" style={{ background: p.bg, borderColor: `${p.color}30` }}>
                  <div className="text-2xl shrink-0">{p.icon}</div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white" style={{ color: p.color }}>
                      {lang === 'he' ? p.titleHe : p.titleEn}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {lang === 'he' ? p.descHe : p.descEn}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Tech tags */}
          <Reveal>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Next.js 16', 'TypeScript', 'Tailwind v4', 'Vercel Serverless', 'RSS Parser', 'Polymarket API', 'Gmail SMTP', 'Vercel KV'].map(t => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 font-mono">{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 space-y-3">
              <p className="text-xs uppercase tracking-widest text-green-400 font-semibold">
                {lang === 'he' ? 'קהלי יעד' : 'Use cases'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {lang === 'he' ? 'מי משתמש ב-Signal News?' : 'Who uses Signal News?'}
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.emoji} delay={i * 100}>
                <div className="text-center p-6 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-3 h-full">
                  <div className="text-4xl">{u.emoji}</div>
                  <h3 className="text-lg font-bold text-white">{lang === 'he' ? u.titleHe : u.titleEn}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{lang === 'he' ? u.descHe : u.descEn}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maof Connection ── */}
      <section className="py-16 px-6 border-y border-indigo-900/30 bg-indigo-950/20">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                🏫
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                  {lang === 'he' ? 'חלק ממיזם מעוף' : 'Part of Project Maof'}
                </p>
                <h3 className="text-xl font-bold text-white">
                  {lang === 'he'
                    ? 'Signal News הוא הדמו הטכנולוגי של מיזם מעוף — מערכת AI להון אנושי בחינוך'
                    : 'Signal News is the tech demo for Project Maof — an AI-powered human capital system for education'}
                </h3>
                <p className="text-sm text-gray-400">
                  {lang === 'he'
                    ? 'מיזם מעוף מחבר לוחמים משוחררים מצה"ל למערכת החינוך ולהייטק במודל 2+2. Signal News מדגים את יכולת ה-AI של הפלטפורמה ללא עלות API.'
                    : 'Project Maof connects IDF veterans to education and high-tech via a 2+2 model. Signal News demonstrates the platform\'s AI capabilities at zero API cost.'}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA + Email ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {lang === 'he' ? 'מוכן לראות את זה בפעולה?' : 'Ready to see it in action?'}
              </h2>
              <p className="text-gray-400">
                {lang === 'he'
                  ? 'הדמו החי פועל עכשיו — 38 מקורות, Shock Detection, Signal vs Polymarket.'
                  : 'Live demo is running now — 38 sources, Shock Detection, Signal vs Polymarket.'}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-gray-950 font-bold text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg shadow-yellow-400/20"
              >
                {lang === 'he' ? 'פתח דמו חי' : 'Open Live Demo'}
                <span className={lang === 'he' ? 'rotate-180 inline-block' : ''}>→</span>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#060a14] text-gray-500 text-sm">
                  {lang === 'he' ? 'או קבל עדכון יומי' : 'or get a daily update'}
                </span>
              </div>
            </div>

            {emailSubmitted ? (
              <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-green-400/10 border border-green-400/30 text-green-400 font-medium mt-4">
                ✅ {lang === 'he' ? 'נרשמת! התקציר הראשון יגיע מחר ב-07:00' : 'Subscribed! First brief arrives tomorrow at 7am'}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-4">
                <input
                  type="email"
                  required
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  placeholder={lang === 'he' ? 'האימייל שלך' : 'your@email.com'}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-6 py-3 rounded-xl bg-yellow-400 text-gray-950 font-bold hover:bg-yellow-300 transition-colors shrink-0 disabled:opacity-60"
                >
                  {emailLoading ? '...' : lang === 'he' ? 'הרשמה' : 'Subscribe'}
                </button>
              </form>
            )}
            <p className="text-xs text-gray-600 mt-3">
              {lang === 'he' ? 'תקציר מודיעיני כל בוקר ב-07:00 · ללא ספאם · ביטול בכל עת' : 'Daily brief at 7am · No spam · Unsubscribe anytime'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/50 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-yellow-400">⚡</span>
            <span>Signal News · {lang === 'he' ? 'מיזם מעוף' : 'Project Maof'}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-white transition-colors">{lang === 'he' ? 'דשבורד' : 'Dashboard'}</Link>
            <Link href="/brief" className="hover:text-white transition-colors">{lang === 'he' ? 'תקציר יומי' : 'Daily Brief'}</Link>
            <a href="https://github.com/Noam1316/signal-news" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
