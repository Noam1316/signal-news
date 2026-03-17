'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
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
  const previewStory = stories[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailSubmitted(true);
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
            href="/brief"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {ui('dailyBrief')}
          </Link>
          <Link
            href="/shocks"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {ui('shockFeed')}
          </Link>
          <Link
            href="/explore"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {ui('explore')}
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
            href="/brief"
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
              {ui('emailThanks')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder={ui('emailPlaceholder')}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-yellow-400 text-gray-950 font-bold hover:bg-yellow-300 transition-colors
                           shrink-0"
              >
                {ui('subscribe')}
              </button>
            </form>
          )}

          <p className="text-sm text-gray-500">{ui('emailSignupNote')}</p>
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
