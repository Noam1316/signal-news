'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 pb-20 md:pb-4">{children}</main>
      <BottomNav />
    </>
  );
}
