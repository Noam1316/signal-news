'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import NewsTicker from './NewsTicker';
import ScrollToTop from '@/components/shared/ScrollToTop';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const isDashboard = pathname === '/dashboard';

  if (isLanding) {
    return <main>{children}</main>;
  }

  // Dashboard has its own SectionNav and ScrollToTop
  if (isDashboard) {
    return (
      <>
        <Navbar />
        <div className="pt-16">
          <NewsTicker />
          <main>{children}</main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <NewsTicker />
        <main className="pb-20 md:pb-4">{children}</main>
      </div>
      <BottomNav />
      <ScrollToTop />
    </>
  );
}
