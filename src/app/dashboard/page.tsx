'use client';

import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/context';
import SectionNav from '@/components/layout/SectionNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import HeroBar from '@/components/brief/HeroBar';
import TrackRecord from '@/components/brief/TrackRecord';
import ScrollToTop from '@/components/shared/ScrollToTop';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

/* Lazy-load heavy sections — only ship JS when scrolled into view */
const ShockFeed = dynamic(() => import('@/components/shocks/ShockFeed'), {
  loading: () => <div className="h-40 rounded-xl bg-gray-900/50 animate-pulse" />,
});
const MapEntities = dynamic(() => import('@/components/map/MapEntities'), {
  loading: () => <div className="h-40 rounded-xl bg-gray-900/50 animate-pulse" />,
});
const IntelHub = dynamic(() => import('@/components/intel/IntelHub'), {
  loading: () => <div className="h-40 rounded-xl bg-gray-900/50 animate-pulse" />,
});

export default function DashboardPage() {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="min-h-screen">
      <HeroBar />
      <SectionNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-12">
        {/* ── Brief ── */}
        <section id="brief" className="scroll-mt-24">
          <DateHeader />
          {/* 2-column on large screens: news feed left, track record right */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            <BriefList />
            <TrackRecord />
          </div>
        </section>

        {/* ── Shocks ── */}
        <section id="shocks" className="scroll-mt-24">
          <ShockFeed />
        </section>

        {/* ── Map & Entities ── */}
        <section id="map" className="scroll-mt-24">
          <MapEntities />
        </section>

        {/* ── Intel Hub ── */}
        <section id="intel" className="scroll-mt-24">
          <IntelHub />
        </section>
      </div>

      <ScrollToTop />
      <OnboardingTour />
    </div>
  );
}
