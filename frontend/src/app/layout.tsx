import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import KeepAlivePing from "@/components/KeepAlivePing";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import FloatingAdvisorButton from "@/components/FloatingAdvisorButton";
import { LanguageProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://akilli-yatirim-platformu.vercel.app";
const SITE_DESCRIPTION =
  "Kripto, döviz, altın ve borsa yatırımlarını tek yerde takip et; enflasyona göre gerçek (reel) getirini gör. Yapay zekâ destekli portföy takip platformu.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Akıllı Portföy — Enflasyona Göre Reel Getiri & Portföy Takip",
    template: "%s · Akıllı Portföy",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Akıllı Portföy",
  manifest: "/manifest.json",
  keywords: [
    "portföy takip",
    "reel getiri",
    "enflasyona göre getiri",
    "yatırım takip",
    "BIST",
    "kripto",
    "altın",
    "döviz",
    "yapay zeka yatırım asistanı",
    "TÜFE reel getiri",
  ],
  authors: [{ name: "Akıllı Portföy" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "Akıllı Portföy",
    title: "Akıllı Portföy — Enflasyona karşı gerçek getirini gör",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Akıllı Portföy — Enflasyona karşı gerçek getirini gör",
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Akıllı Portföy",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ServiceWorkerRegister />
          <KeepAlivePing />
          <FloatingAdvisorButton />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
            Bu platform ve içerdiği yapay zekâ asistanı yatırım tavsiyesi değildir, yalnızca
            genel bilgilendirme amaçlıdır. Yatırım kararlarınızdan önce yetkili bir uzmana danışın.
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
