"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

// Sayfanin sag altinda sabit duran, tiklayinca Yatirim Asistani'na goturen
// yuvarlak buton. Yalnizca giris yapmis kullaniciya ve asistan sayfasi
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
      title="Yatırım Asistanı"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-1 ring-black/5 transition hover:scale-105 hover:bg-indigo-500"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 7v1M9 11h6" />
        <circle cx="12" cy="7" r="0.5" fill="currentColor" />
      </svg>
    </Link>
  );
}
