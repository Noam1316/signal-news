import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
import { LanguageProvider } from "@/i18n/context";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import LayoutShell from "@/components/layout/LayoutShell";
import ArticleSidebar from "@/components/layout/ArticleSidebar";
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
    default: "Zikuk — מזקק רעש לסיגנל",
    template: "%s | Zikuk",
  },
  description: "Zikuk מזקק 28+ מקורות RSS למודיעין גיאופוליטי: ציוני סבירות, זיהוי זעזועים, ניתוח הטיה תקשורתית. Distilling geopolitical noise into signal.",
  keywords: [
    'news intelligence', 'geopolitical analysis', 'media bias', 'news likelihood',
    'signal vs noise', 'polymarket', 'news analysis', 'real-time news',
    'מודיעין חדשות', 'ניתוח גיאופוליטי', 'הטיה תקשורתית',
  ],
  authors: [{ name: 'Zikuk' }],
  creator: 'Zikuk',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zikuk',
  },
  openGraph: {
    title: "Zikuk — מזקק רעש לסיגנל",
    description: "Zikuk מזקק 28+ מקורות RSS למודיעין גיאופוליטי. Distilling geopolitical noise into signal.",
    siteName: "Zikuk",
    type: "website",
    url: BASE_URL,
    locale: 'he_IL',
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'Zikuk — Real-time geopolitical intelligence' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zikuk",
    description: "Real-time news intelligence — likelihood scores, shock detection, Polymarket comparison.",
    creator: "@zikukai",
    images: [`${BASE_URL}/opengraph-image`],
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
    name: 'Zikuk',
    description: 'Distilling geopolitical noise into signal — likelihood scores, shock detection, media bias, Polymarket comparison.',
    url: BASE_URL,
    applicationCategory: 'NewsApplication',
    operatingSystem: 'Web',
    inLanguage: ['en', 'he'],
    author: {
      '@type': 'Organization',
      name: 'Zikuk',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="he" dir="rtl">
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
              <SidebarProvider>
                <LayoutShell>{children}</LayoutShell>
                <ArticleSidebar />
                <ServiceWorkerRegistrar />
              </SidebarProvider>
            </PreferencesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
