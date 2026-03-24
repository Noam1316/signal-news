import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
import { LanguageProvider } from "@/i18n/context";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
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

const BASE_URL = 'https://signal-news-noam1316s-projects.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Signal News — Know what's likely next",
    template: "%s | Signal News",
  },
  description: "Real-time geopolitical news intelligence: likelihood scores, shock detection, media bias analysis, and Polymarket comparison — across 28+ sources. No noise, just signal.",
  keywords: [
    'news intelligence', 'geopolitical analysis', 'media bias', 'news likelihood',
    'signal vs noise', 'polymarket', 'news analysis', 'real-time news',
    'מודיעין חדשות', 'ניתוח גיאופוליטי', 'הטיה תקשורתית',
  ],
  authors: [{ name: 'Signal News' }],
  creator: 'Signal News',
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
    title: "Signal News — Know what's likely next",
    description: "Real-time geopolitical news intelligence with likelihood scores, shock detection, and media bias analysis across 28+ sources.",
    siteName: "Signal News",
    type: "website",
    url: BASE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal News",
    description: "Real-time news intelligence — likelihood scores, shock detection, Polymarket comparison.",
    creator: "@signalnews",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Signal News',
    description: 'Real-time geopolitical news intelligence with likelihood scores, shock detection, and media bias analysis.',
    url: BASE_URL,
    applicationCategory: 'NewsApplication',
    operatingSystem: 'Web',
    inLanguage: ['en', 'he'],
    author: {
      '@type': 'Organization',
      name: 'Signal News',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.variable} ${heebo.variable} antialiased`}>
        <a href="#brief" className="skip-to-content">
          Skip to content
        </a>
        <ThemeProvider>
          <LanguageProvider>
            <PreferencesProvider>
              <LayoutShell>{children}</LayoutShell>
              <ServiceWorkerRegistrar />
            </PreferencesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
