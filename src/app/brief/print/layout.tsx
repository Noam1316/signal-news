export default function PrintLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout — no Navbar, no NewsTicker, no BottomNav
  // The print page has its own toolbar
  return <>{children}</>;
}
