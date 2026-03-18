'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
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
        <main className="pt-16">{children}</main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 pb-20 md:pb-4">{children}</main>
      <BottomNav />
      <ScrollToTop />
    </>
  );
}
