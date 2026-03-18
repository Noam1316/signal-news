import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/context";
import LayoutShell from "@/components/layout/LayoutShell";
import ServiceWorkerRegistrar from "@/components/shared/ServiceWorkerRegistrar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Signal News — Know what's likely next",
  description: "A real-time news intelligence layer that turns chaos into clarity: likelihood scores, narrative analysis, and lens differences — with sources and confidence.",
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Signal News',
  },
  openGraph: {
    title: "Signal News",
    description: "Know what's likely next — without the noise. Real-time news intelligence with likelihood scores and multi-lens analysis.",
    siteName: "Signal News",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal News",
    description: "Know what's likely next — without the noise.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.variable} ${heebo.variable} antialiased`}>
        <LanguageProvider>
          <LayoutShell>{children}</LayoutShell>
          <ServiceWorkerRegistrar />
        </LanguageProvider>
      </body>
    </html>
  );
}
