import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akıllı Yatırım Danışmanı",
  description:
    "Kripto, döviz, altın ve borsa verilerini tek yerde takip eden, yapay zekâ destekli yatırım danışmanlığı platformu",
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
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
          Bu platform ve içerdiği yapay zekâ danışmanı yatırım tavsiyesi değildir, yalnızca
          genel bilgilendirme amaçlıdır. Yatırım kararlarınızdan önce bir uzmana danışın.
        </footer>
      </body>
    </html>
  );
}
