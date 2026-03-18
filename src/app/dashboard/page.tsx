'use client';

import { useLanguage } from '@/i18n/context';
import SectionNav from '@/components/layout/SectionNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import ShockFeed from '@/components/shocks/ShockFeed';
import LiveWire from '@/components/explore/LiveWire';
import GeoMap from '@/components/map/GeoMap';
import IntelDashboard from '@/components/intel/IntelDashboard';
import EntityGraph from '@/components/entities/EntityGraph';
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

        {/* ── Explore Section ── */}
        <section id="explore" className="scroll-mt-28">
          <LiveWire />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Map Section ── */}
        <section id="map" className="scroll-mt-28">
          <GeoMap />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Entities Section ── */}
        <section id="entities" className="scroll-mt-28">
          <EntityGraph />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Intel Section ── */}
        <section id="intel" className="scroll-mt-28">
          <IntelDashboard />
        </section>
      </div>

      <ScrollToTop />
    </div>
  );
}
