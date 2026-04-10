'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/context';
import { usePreferences } from '@/contexts/PreferencesContext';
import SectionNav from '@/components/layout/SectionNav';
import BottomNav from '@/components/layout/BottomNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import HeroBar from '@/components/brief/HeroBar';
import TrackRecord from '@/components/brief/TrackRecord';
import StoryOfTheDay from '@/components/brief/StoryOfTheDay';
import SignalVsTraditional from '@/components/brief/SignalVsTraditional';
import ScrollToTop from '@/components/shared/ScrollToTop';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import EmailSubscribe from '@/components/alerts/EmailSubscribe';
import PushSubscribe from '@/components/alerts/PushSubscribe';

/* Lazy-load heavy sections — only ship JS when scrolled into view */
const ShockFeed = dynamic(() => import('@/components/shocks/ShockFeed'), {
  loading: () => (
    <div className="space-y-3">
      <div className="h-6 w-40 bg-gray-800 rounded animate-pulse" />
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 space-y-3 animate-pulse">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-gray-700" />
            <div className="h-3 w-16 bg-gray-800 rounded" />
            <div className="h-3 w-24 bg-gray-800 rounded ms-auto" />
          </div>
          <div className="h-4 w-3/4 bg-gray-800 rounded" />
          <div className="h-3 w-full bg-gray-800 rounded" />
          <div className="h-3 w-2/3 bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  ),
});
const MapEntities = dynamic(() => import('@/components/map/MapEntities'), {
  loading: () => (
    <div className="space-y-3">
      <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 animate-pulse" style={{ height: 340 }}>
        <div className="h-full w-full bg-gray-800/30 rounded-xl" />
      </div>
    </div>
  ),
});
const IntelHub = dynamic(() => import('@/components/intel/IntelHub'), {
  loading: () => (
    <div className="space-y-3">
      <div className="h-6 w-36 bg-gray-800 rounded animate-pulse" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 flex-1 bg-gray-800 rounded-lg animate-pulse" />)}
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 space-y-3 animate-pulse">
        <div className="h-4 w-1/2 bg-gray-800 rounded" />
        <div className="h-3 w-full bg-gray-800 rounded" />
        <div className="h-3 w-5/6 bg-gray-800 rounded" />
        <div className="h-24 w-full bg-gray-800/50 rounded-lg" />
      </div>
    </div>
  ),
});

const SECTION_IDS = ['brief', 'shocks', 'map', 'intel'];

export default function DashboardPage() {
  const { dir } = useLanguage();
  const { prefs } = usePreferences();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  /* ── Mobile swipe navigation ── */
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only horizontal swipes (dx dominant and > 75px)
      if (Math.abs(dx) < 75 || Math.abs(dy) > Math.abs(dx) * 0.8) return;

      // Find current section (center of viewport)
      const midY = window.innerHeight / 2;
      const currentIdx = SECTION_IDS.findIndex(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= midY && rect.bottom >= 0;
      });

      // RTL: swipe left (dx < 0) = next; swipe right (dx > 0) = prev
      const isRTL = dir === 'rtl';
      const goNext = isRTL ? dx > 0 : dx < 0;
      const nextIdx = goNext ? currentIdx + 1 : currentIdx - 1;

      if (nextIdx >= 0 && nextIdx < SECTION_IDS.length) {
        document.getElementById(SECTION_IDS[nextIdx])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dir]);

  return (
    <div dir={dir} className="min-h-screen">
      <HeroBar />
      <SectionNav />

      {/* pb-20 on mobile to clear the BottomNav; none on desktop */}
      <div className={`max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6 ${prefs.compactMode ? 'space-y-6' : 'space-y-12'}`}>
        {/* ── Brief ── */}
        {!prefs.hiddenSections.includes('brief') && (
          <section id="brief" className="scroll-mt-24">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <DateHeader />
              <div className="flex items-center gap-2 flex-wrap">
                <PushSubscribe />
                <EmailSubscribe />
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <StoryOfTheDay />
              <SignalVsTraditional />
              {/* 2-column on large screens: news feed left, track record right */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
                <BriefList compactMode={prefs.compactMode} />
                <div className="order-first lg:order-last">
                  <TrackRecord />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Shocks ── */}
        {!prefs.hiddenSections.includes('shocks') && (
          <section id="shocks" className="scroll-mt-24">
            <ShockFeed />
          </section>
        )}

        {/* ── Map & Entities ── */}
        {!prefs.hiddenSections.includes('map') && (
          <section id="map" className="scroll-mt-24">
            <MapEntities />
          </section>
        )}

        {/* ── Intel Hub ── */}
        {!prefs.hiddenSections.includes('intel') && (
          <section id="intel" className="scroll-mt-24">
            <IntelHub />
          </section>
        )}
      </div>

      <ScrollToTop />
      <BottomNav />
      <OnboardingTour />
    </div>
  );
}
