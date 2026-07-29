import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import KeepAlivePing from "@/components/KeepAlivePing";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akıllı Portföy",
  description:
    "Kripto, döviz, altın ve borsa yatırımlarını tek yerde takip et; enflasyona göre gerçek (reel) getirini gör. Yapay zekâ destekli portföy takip platformu.",
  manifest: "/manifest.json",
  applicationName: "Akıllı Portföy",
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
        <ServiceWorkerRegister />
        <KeepAlivePing />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
          Bu platform ve içerdiği yapay zekâ asistanı yatırım tavsiyesi değildir, yalnızca
          genel bilgilendirme amaçlıdır. Yatırım kararlarınızdan önce yetkili bir uzmana danışın.
        </footer>
      </body>
    </html>
  );
}
