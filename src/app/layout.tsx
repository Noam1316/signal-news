import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/context";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

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
  description: "A real-time news layer that turns chaos into clarity: likelihood, narratives, and lens differences — with sources and confidence.",
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
          <Navbar />
          <main className="pt-16 pb-20 md:pb-4">
            {children}
          </main>
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
