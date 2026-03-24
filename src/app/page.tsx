'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
import { useReferral } from '@/hooks/useReferral';
import { stories } from '@/data/stories';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SignalLabel from '@/components/shared/SignalLabel';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { ui, t, dir, lang, toggleLang } = useLanguage();
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewStory = stories[0];
  const { myCode, referralCount, shareUrl, copyShareLink, hasProUnlock, nextMilestone } = useReferral();

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
    } catch { /* silent */ } finally {
      setEmailLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir={dir} className="min-h-screen">
      {/* ─── Floating top bar ─── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-6 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center gap-1.5 text-white font-bold text-lg tracking-tight">
          <span className="text-yellow-400 text-xl">&#9889;</span>
          <span>{ui('appName')}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-yellow-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {lang === 'he' ? 'דשבורד' : 'Dashboard'}
          </Link>
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
          >
            {lang === 'en' ? 'HE' : 'EN'}
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0f1729] to-[#0a0f1a] pointer-events-none" />
        {/* Subtle radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-slide-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl md:text-6xl text-yellow-400 animate-pulse-glow">&#9889;</span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Signal News
            </h1>
          </div>

          {/* Slogan */}
          <p className="text-xl md:text-2xl font-medium text-gray-200 max-w-xl mx-auto leading-relaxed">
            {ui('slogan')}
          </p>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto">
            {ui('landingSubtitle')}
          </p>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-yellow-400 text-gray-950 font-bold text-lg
                       hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-lg shadow-yellow-400/20"
          >
            {ui('landingCta')}
            <span className={lang === 'he' ? 'rotate-180 inline-block' : ''}>&rarr;</span>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ─── Feature Pills ─── */}
      <RevealSection className="py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4">
          {/* Likelihood pill */}
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
              <path d="M12 20V10M18 20V4M6 20v-4" />
            </svg>
            <span className="text-sm font-medium text-gray-200">{ui('featureLikelihood')}</span>
          </div>
          {/* Sources pill */}
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-sm font-medium text-gray-200">{ui('featureSources')}</span>
          </div>
          {/* Signal vs Noise pill */}
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="text-sm font-medium text-gray-200">{ui('featureSignalNoise')}</span>
          </div>
        </div>
      </RevealSection>

      {/* ─── Live Example (Phone Mockup) ─── */}
      <RevealSection className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm uppercase tracking-widest text-gray-500 mb-8">
            {ui('liveExample')}
          </h2>

          {/* Phone frame */}
          <div className="mx-auto max-w-sm">
            <div className="relative rounded-[2.5rem] border-2 border-gray-700 bg-gray-900 p-3 shadow-2xl shadow-black/50">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl border-x-2 border-b-2 border-gray-700 z-10" />

              {/* Screen */}
              <div className="rounded-[2rem] bg-[#0a0f1a] p-5 pt-8 space-y-3 overflow-hidden">
                {/* Story card preview */}
                <div dir={dir} className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400">
                      {t(previewStory.category)}
                    </span>
                    <SignalLabel isSignal={previewStory.isSignal} />
                  </div>

                  <h3 className="text-base font-semibold leading-snug text-white">
                    {t(previewStory.headline)}
                  </h3>

                  <p className="text-sm text-gray-300 line-clamp-2">
                    {t(previewStory.summary)}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <LikelihoodMeter value={previewStory.likelihood} label={previewStory.likelihoodLabel} />
                    </div>
                    <DeltaIndicator delta={previewStory.delta} />
                  </div>

                  <p className="text-sm italic text-gray-400 line-clamp-2">
                    {t(previewStory.why)}
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {previewStory.sources.map((s) => (
                      <span key={s.name} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── How It Works ─── */}
      <RevealSection className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-12">
            {ui('howItWorks')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
              <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className="text-sm text-yellow-400 font-semibold">01</div>
              <h3 className="text-lg font-semibold text-white">{ui('howStep1Title')}</h3>
              <p className="text-sm text-gray-400">{ui('howStep1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
              <div className="w-14 h-14 rounded-full bg-blue-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-sm text-blue-400 font-semibold">02</div>
              <h3 className="text-lg font-semibold text-white">{ui('howStep2Title')}</h3>
              <p className="text-sm text-gray-400">{ui('howStep2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
              <div className="w-14 h-14 rounded-full bg-green-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="text-sm text-green-400 font-semibold">03</div>
              <h3 className="text-lg font-semibold text-white">{ui('howStep3Title')}</h3>
              <p className="text-sm text-gray-400">{ui('howStep3Desc')}</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── Stats Bar ─── */}
      <RevealSection className="py-10 px-6 border-y border-gray-800/50">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '28+', label: lang === 'he' ? 'מקורות חדשות' : 'News Sources' },
            { value: '24/7', label: lang === 'he' ? 'ניטור רציף' : 'Live Monitoring' },
            { value: '100%', label: lang === 'he' ? 'ללא עלות API' : 'No API Cost' },
            { value: '0₪', label: lang === 'he' ? 'חינמי לחלוטין' : 'Free Forever' },
          ].map(stat => (
            <div key={stat.value}>
              <div className="text-3xl font-black text-yellow-400">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ─── Pricing ─── */}
      <RevealSection className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-black text-white mb-3">
            {lang === 'he' ? 'תמחור פשוט' : 'Simple Pricing'}
          </h2>
          <p className="text-center text-gray-400 mb-12">
            {lang === 'he' ? 'מתחיל חינמי — שדרג כשתרצה' : 'Start free — upgrade when ready'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Free</div>
              <div className="text-4xl font-black text-white">₪0</div>
              <div className="text-sm text-gray-500">{lang === 'he' ? 'לתמיד' : 'forever'}</div>
              <hr className="border-gray-800" />
              <ul className="space-y-2 text-sm text-gray-300">
                {(lang === 'he' ? [
                  '5 סיפורים ביום',
                  'זיהוי זעזועים',
                  'מפה גיאופוליטית',
                  '5 שווקי Polymarket',
                  'מייל יומי (תקציר קצר)',
                ] : [
                  '5 stories/day',
                  'Shock detection',
                  'Geopolitical map',
                  '5 Polymarket markets',
                  'Daily email brief',
                ]).map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard"
                className="block text-center py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-semibold">
                {lang === 'he' ? 'התחל עכשיו' : 'Get Started'}
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-950/30 p-6 space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-indigo-500 text-white px-3 py-1 rounded-full font-bold">
                {lang === 'he' ? 'הכי פופולרי' : 'Most Popular'}
              </div>
              <div className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Pro</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">₪49</span>
                <span className="text-gray-400 text-sm">{lang === 'he' ? '/חודש' : '/mo'}</span>
              </div>
              <div className="text-sm text-gray-500">₪470{lang === 'he' ? '/שנה (חיסכון 20%)' : '/yr (save 20%)'}</div>
              <hr className="border-indigo-900" />
              <ul className="space-y-2 text-sm text-gray-300">
                {(lang === 'he' ? [
                  'הכל בחינמי +',
                  'סיפורים ללא הגבלה',
                  'מייל מפורט מלא (דף שלם)',
                  'כל שווקי Polymarket (50+)',
                  'Watchlist + התראות',
                  'כתבות מקובצות',
                  'ייצוא PDF',
                  'היסטוריה 90 יום',
                ] : [
                  'Everything in Free +',
                  'Unlimited stories',
                  'Full daily brief email',
                  'All Polymarket markets (50+)',
                  'Watchlist + alerts',
                  'Grouped stories',
                  'PDF export',
                  '90-day history',
                ]).map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-indigo-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="block w-full text-center py-2.5 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-colors text-sm">
                {lang === 'he' ? 'בקרוב' : 'Coming Soon'}
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Enterprise</div>
              <div className="text-4xl font-black text-white">₪990</div>
              <div className="text-sm text-gray-500">{lang === 'he' ? '/חודש' : '/month'}</div>
              <hr className="border-gray-800" />
              <ul className="space-y-2 text-sm text-gray-300">
                {(lang === 'he' ? [
                  'הכל ב-Pro +',
                  'API Access (JSON feed)',
                  'Slack/Teams webhook',
                  'White-label',
                  'מקורות RSS מותאמים',
                  'SLA + תמיכה ישירה',
                ] : [
                  'Everything in Pro +',
                  'API Access (JSON feed)',
                  'Slack/Teams webhook',
                  'White-label',
                  'Custom RSS sources',
                  'SLA + direct support',
                ]).map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:noam@signal-news.io"
                className="block text-center py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-semibold">
                {lang === 'he' ? 'צור קשר' : 'Contact Us'}
              </a>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── Referral Section ─── */}
      <RevealSection className="py-16 px-6 bg-indigo-950/20 border-y border-indigo-900/30">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="text-4xl">🎁</div>
          <h2 className="text-2xl font-black text-white">
            {lang === 'he' ? 'שתף וקבל Pro בחינם' : 'Refer friends, get Pro free'}
          </h2>
          <p className="text-gray-400 text-sm">
            {lang === 'he'
              ? 'הזמן 5 חברים → קבל חודש Pro חינם. 3 הזמנות → שבוע Pro.'
              : 'Invite 5 friends → get 1 month Pro free. 3 invites → 1 week Pro.'}
          </p>

          {/* Progress */}
          {referralCount > 0 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-indigo-400 font-bold">{referralCount}</span>
              <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (referralCount / 5) * 100)}%` }} />
              </div>
              <span className="text-gray-500">/ 5</span>
              {hasProUnlock && <span className="text-yellow-400 font-bold">🏆 Pro פתוח!</span>}
            </div>
          )}

          {/* Share link */}
          {myCode && (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-mono text-left" dir="ltr">
              <span className="flex-1 text-gray-300 truncate">{shareUrl}</span>
              <button onClick={handleCopy}
                className="shrink-0 px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-400 transition-colors">
                {copied ? '✓' : lang === 'he' ? 'העתק' : 'Copy'}
              </button>
            </div>
          )}

          {nextMilestone && (
            <p className="text-xs text-gray-500">
              {lang === 'he'
                ? `עוד ${nextMilestone - referralCount} הזמנות להטבה הבאה`
                : `${nextMilestone - referralCount} more invites to next reward`}
            </p>
          )}
        </div>
      </RevealSection>

      {/* ─── Email Signup ─── */}
      <RevealSection className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {ui('emailSignupTitle')}
          </h2>

          {emailSubmitted ? (
            <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-green-400/10 border border-green-400/30 text-green-400 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {lang === 'he' ? '✅ נרשמת! התקציר הראשון יגיע מחר ב-07:00' : '✅ Subscribed! First brief arrives tomorrow at 7am'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={emailValue}
                onChange={e => setEmailValue(e.target.value)}
                placeholder={ui('emailPlaceholder')}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={emailLoading}
                className="px-6 py-3 rounded-xl bg-yellow-400 text-gray-950 font-bold hover:bg-yellow-300 transition-colors shrink-0 disabled:opacity-60"
              >
                {emailLoading ? '...' : ui('subscribe')}
              </button>
            </form>
          )}

          <p className="text-sm text-gray-500">{lang === 'he' ? '📧 תקציר מודיעיני כל בוקר ב-07:00 · ללא ספאם · ביטול בכל עת' : '📧 Daily brief at 7am · No spam · Unsubscribe anytime'}</p>
        </div>
      </RevealSection>

      {/* ─── Embed Code ─── */}
      <RevealSection className="py-12 px-6 border-t border-gray-800/50">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h3 className="text-lg font-bold text-white">
            {lang === 'he' ? '🔗 הטמע Signal News באתר שלך' : '🔗 Embed Signal News on your site'}
          </h3>
          <p className="text-sm text-gray-500">
            {lang === 'he' ? 'העתק את הקוד והדבק בכל אתר' : 'Copy the code and paste anywhere'}
          </p>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-left font-mono text-xs text-gray-300" dir="ltr">
            {'<iframe src="https://signal-news-noam1316s-projects.vercel.app/embed/signal-of-the-day" width="440" height="220" frameborder="0" style="border-radius:14px"></iframe>'}
          </div>
        </div>
      </RevealSection>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-800/50 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Built with &#10084;&#65039; and data
          </p>
          <div className="flex items-center gap-6">
            <Link href="/brief" className="text-sm text-gray-400 hover:text-white transition-colors">
              {ui('dailyBrief')}
            </Link>
            <Link href="/shocks" className="text-sm text-gray-400 hover:text-white transition-colors">
              {ui('shockFeed')}
            </Link>
            <Link href="/explore" className="text-sm text-gray-400 hover:text-white transition-colors">
              {ui('explore')}
            </Link>
            <a
              href="https://github.com/Noam1316/signal-news"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {ui('github')}
            </a>
            <Link href="/rss-debug" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              RSS Debug
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
