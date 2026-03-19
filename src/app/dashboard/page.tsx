'use client';

import dynamic from 'next/dynamic';
import { useLanguage } from '@/i18n/context';
import SectionNav from '@/components/layout/SectionNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import ScrollToTop from '@/components/shared/ScrollToTop';

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
      <SectionNav />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {/* ── Brief ── */}
        <section id="brief" className="scroll-mt-24">
          <DateHeader />
          <div className="mt-3"><BriefList /></div>
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
    </div>
  );
}
