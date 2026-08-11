"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

// Sayfanin sag altinda sabit duran, tiklayinca Yatirim Asistani'na goturen
// gradientli, hafif parlayan (glow) hap buton. Yaninda "Yatirim Asistani"
// yazisi ile ne oldugu net anlasilir. Yalnizca giris yapmis kullaniciya ve
// asistan sayfasi disindaki sayfalarda gosterilir.
export default function FloatingAdvisorButton() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, [pathname]);

  // Ana sayfa (landing / dashboard) ve asistan sayfasinin kendisinde gizli;
  // yalnizca ic sayfalarda (portfoy, alarmlar, grafikler vb.) gorunur.
  if (!isLoggedIn || pathname === "/" || pathname === "/advisor") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* arkada hafif nabizli parlama (glow) */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 opacity-60 blur-lg animate-pulse"
      />
      <Link
        href="/advisor"
        aria-label="Yatırım Asistanı'na git"
        className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 py-3 pl-4 pr-5 text-white shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 transition-transform duration-200 hover:scale-105"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="shrink-0"
        >
          <path d="M12 2.5l1.7 4.1a5 5 0 0 0 2.7 2.7L20.5 11l-4.1 1.7a5 5 0 0 0-2.7 2.7L12 19.5l-1.7-4.1a5 5 0 0 0-2.7-2.7L3.5 11l4.1-1.7a5 5 0 0 0 2.7-2.7z" />
          <path d="M19 15.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" />
        </svg>
        <span className="whitespace-nowrap text-sm font-semibold">Yatırım Asistanı</span>
      </Link>
    </div>
  );
}
