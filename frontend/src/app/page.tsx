"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Target, TrendingUp, Bell } from "lucide-react";
import { clearToken, getToken } from "@/lib/auth";

const NAV_LINK_CLASS =
  "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";

const FEATURES = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI Yatırım Asistanı",
    desc: "Güncel finans haberlerini ve senin portföyünü bilen yapay zekâya sor; piyasayı, riskleri ve seçenekleri sade bir dille açıklasın.",
    highlight: true,
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Risk Profili Analizi",
    desc: "Risk toleransın, vaden ve hedefine göre sana uygun örnek varlık dağılımını (borsa / kripto / altın / döviz) gör.",
    highlight: true,
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Reel Getiri Takibi",
    desc: "Enflasyona göre gerçekte kazandın mı kaybettin mi — nominal değil, alım gücü bazında.",
    highlight: false,
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Fiyat Alarmları",
    desc: "Bir varlık hedef fiyatına ulaştığında anında e-posta ile haberdar ol, fırsatı kaçırma.",
    highlight: false,
  },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    clearToken();
    setIsLoggedIn(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="shrink-0 whitespace-nowrap text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl"
            >
              Akıllı Portföy
            </Link>

            <div className="hidden flex-wrap items-center justify-end gap-1 sm:flex">
              <Link href="/charts" className={NAV_LINK_CLASS}>
                Grafikler
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/portfolio" className={NAV_LINK_CLASS}>
                    Portföyüm
                  </Link>
                  <Link href="/alerts" className={NAV_LINK_CLASS}>
                    Alarmlar
                  </Link>
                  <Link href="/advisor" className={NAV_LINK_CLASS}>
                    Yatırım Asistanı
                  </Link>
                  <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={NAV_LINK_CLASS}>
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="ml-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
              className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:hidden">
              <Link href="/charts" className={`${NAV_LINK_CLASS} text-center`} onClick={() => setMenuOpen(false)}>
                Grafikler
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    href="/portfolio"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Portföyüm
                  </Link>
                  <Link
                    href="/alerts"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Alarmlar
                  </Link>
                  <Link
                    href="/advisor"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Yatırım Asistanı
                  </Link>
                  <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 px-6 py-14 text-white shadow-lg sm:px-10 sm:py-16">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
            viewBox="0 0 600 400"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 320 L80 280 L160 300 L240 220 L320 250 L400 150 L480 190 L560 80 L600 110"
              stroke="#818cf8"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M0 360 L90 330 L180 350 L260 280 L340 300 L420 210 L500 240 L600 150"
              stroke="#6366f1"
              strokeWidth="2"
              opacity="0.6"
              fill="none"
            />
            <circle cx="560" cy="80" r="5" fill="#818cf8" />
            <circle cx="400" cy="150" r="3" fill="#818cf8" />
            <circle cx="240" cy="220" r="3" fill="#818cf8" />
          </svg>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Yapay zekâ destekli akıllı portföy platformu
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
              Yatırımlarını tek yerde topla,{" "}
              <span className="text-emerald-400">akıllıca</span> yönet.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-indigo-200/80 sm:text-base">
              Borsa, kripto, altın, döviz, mevduat… hepsi tek panelde. Yapay zekâ
              asistanına sor, risk profilini çıkar ve enflasyona göre{" "}
              <span className="font-medium text-white">gerçek getirini</span> gör.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/portfolio"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-950 shadow-sm transition hover:bg-indigo-50"
                >
                  Portföyüme Git
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
                  >
                    Ücretsiz Başla
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Giriş Yap
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-indigo-300/60">
              Kredi kartı gerekmez · Ücretsiz kayıt · Türkiye piyasalarına özel
            </p>
          </div>
        </section>

        {/* OZELLIKLER - uygulamanin can alici kisimlari */}
        <section>
          <h3 className="text-center text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Sadece takip değil — akıllı bir portföy asistanı
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">
            Yapay zekâ ve kişisel risk analizi ile yatırımlarını daha bilinçli yönet.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`flex gap-4 rounded-xl border p-5 ${
                  f.highlight
                    ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h4>
                  <p className="mt-1 text-sm text-zinc-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alt CTA */}
        {!isLoggedIn && (
          <section className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Yatırımlarının gerçek durumunu bugün gör.
            </h3>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Ücretsiz Başla
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
