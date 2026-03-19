'use client';

import { useLanguage } from '@/i18n/context';
import SectionNav from '@/components/layout/SectionNav';
import BriefList from '@/components/brief/BriefList';
import DateHeader from '@/components/brief/DateHeader';
import ShockFeed from '@/components/shocks/ShockFeed';
import MapEntities from '@/components/map/MapEntities';
import IntelHub from '@/components/intel/IntelHub';
import CredibilityDashboard from '@/components/credibility/CredibilityDashboard';
import EngagementDashboard from '@/components/analytics/EngagementDashboard';
import FeaturesHub from '@/components/features/FeaturesHub';
import ThemeToggle from '@/components/features/ThemeToggle';
import { KeyboardShortcutsModal, useKeyboardShortcuts } from '@/components/features/KeyboardShortcuts';
import ScrollToTop from '@/components/shared/ScrollToTop';

export default function DashboardPage() {
  const { dir } = useLanguage();
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

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

        <div className="border-t border-gray-800/50" />

        {/* ── Credibility Engine Section ── */}
        <section id="credibility" className="scroll-mt-28">
          <CredibilityDashboard />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Engagement Analytics Section ── */}
        <section id="analytics" className="scroll-mt-28">
          <EngagementDashboard />
        </section>

        <div className="border-t border-gray-800/50" />

        {/* ── Features Section ── */}
        <section id="features" className="scroll-mt-28">
          <FeaturesHub />
        </section>
      </div>

      <ThemeToggle />
      <ScrollToTop />
      <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
