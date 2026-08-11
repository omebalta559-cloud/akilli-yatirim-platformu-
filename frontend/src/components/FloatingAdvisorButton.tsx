"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

// Sayfanin sag altinda sabit duran, tiklayinca Yatirim Asistani'na goturen
// buton. Ne oldugu net anlasilsin diye ikonun yaninda "Yatirim Asistani"
// yazisi da var. Yalnizca giris yapmis kullaniciya ve asistan sayfasi
// disindaki sayfalarda gosterilir.
export default function FloatingAdvisorButton() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, [pathname]);

  if (!isLoggedIn || pathname === "/advisor") return null;

  return (
    <Link
      href="/advisor"
      aria-label="Yatırım Asistanı'na git"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-indigo-600 py-3 pl-4 pr-5 text-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 hover:bg-indigo-500"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M9 10h6M9 13h4" />
      </svg>
      <span className="whitespace-nowrap text-sm font-semibold">Yatırım Asistanı</span>
    </Link>
  );
}
