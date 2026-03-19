'use client';

import { useLanguage } from '@/i18n/context';
import SectionNav from '@/components/layout/SectionNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import ShockFeed from '@/components/shocks/ShockFeed';
import MapEntities from '@/components/map/MapEntities';
import IntelHub from '@/components/intel/IntelHub';
import ScrollToTop from '@/components/shared/ScrollToTop';

export default function DashboardPage() {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="min-h-screen">
      {/* Sticky section nav */}
      <SectionNav />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-16">
        {/* ── Brief Section ── */}
        <section id="brief" className="scroll-mt-28">
          <DateHeader />
          <div className="mt-4">
            <BriefList />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800/50" />

        {/* ── Shocks Section ── */}
        <section id="shocks" className="scroll-mt-28">
          <ShockFeed />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Map & Entities Section ── */}
        <section id="map" className="scroll-mt-28">
          <MapEntities />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Intel Hub Section ── */}
        <section id="intel" className="scroll-mt-28">
          <IntelHub />
        </section>
      </div>

      <ScrollToTop />
    </div>
  );
}
