"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Target, TrendingUp, Bell, LineChart, Wallet } from "lucide-react";
import { clearToken, getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV_LINK_CLASS =
  "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";

const API_URL = getApiUrl();

const FEATURES = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    titleKey: "feat.advisor.title",
    descKey: "feat.advisor.desc",
    highlight: true,
  },
  {
    icon: <Target className="h-5 w-5" />,
    titleKey: "feat.risk.title",
    descKey: "feat.risk.desc",
    highlight: true,
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    titleKey: "feat.portfolio.title",
    descKey: "feat.portfolio.desc",
    highlight: false,
  },
  {
    icon: <Bell className="h-5 w-5" />,
    titleKey: "feat.alerts.title",
    descKey: "feat.alerts.desc",
    highlight: false,
  },
  {
    icon: <LineChart className="h-5 w-5" />,
    titleKey: "feat.livePrices.title",
    descKey: "feat.livePrices.desc",
    highlight: false,
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    titleKey: "feat.real.title",
    descKey: "feat.real.desc",
    highlight: false,
  },
];

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fetchWithTimeout(url: string, timeoutMs = 40000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

type CryptoPrices = Record<string, { usd: number; usd_24h_change?: number }>;

type ForexRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type GoldItem = {
  name: string;
  buying: number;
  selling: number;
  rate?: number;
};

type GoldResponse = {
  result: GoldItem[];
};

type StockItem = {
  name: string;
  price: number;
  rate: number;
};

type StockResponse = {
  result: StockItem[];
};

type FundItem = {
  code: string;
  name: string;
  price: number | null;
  date: string | null;
};

// Ana sayfada gosterilen ornek yatirim fonlari (Kuveyt Turk katilim fonlari).
const FUND_CODES = ["KUT", "KTJ", "KLU"];

export default function Home() {
  const { t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [crypto, setCrypto] = useState<CryptoPrices | null>(null);
  const [forex, setForex] = useState<ForexRates | null>(null);
  const [gold, setGold] = useState<GoldItem[] | null>(null);
  const [stocks, setStocks] = useState<StockItem[] | null>(null);
  const [funds, setFunds] = useState<FundItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    clearToken();
    setIsLoggedIn(false);
  }

  // Canli piyasa fiyatlari yalnizca giris yapmis kullaniciya, ana sayfanin
  // alt kismindaki panoda gosterilir; bu yuzden veriyi de sadece o zaman cek.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    async function loadMarketData() {
      setError(null);

      const [cryptoResult, forexResult, goldResult, stocksResult] = await Promise.allSettled([
        fetchWithTimeout(`${API_URL}/market/crypto?coins=bitcoin,ethereum`).then((r) => {
          if (!r.ok) throw new Error("crypto");
          return r.json();
        }),
        fetchWithTimeout(`${API_URL}/market/forex?base=USD&symbols=TRY,EUR`).then((r) => {
          if (!r.ok) throw new Error("forex");
          return r.json();
        }),
        fetchWithTimeout(`${API_URL}/market/gold`).then((r) => {
          if (!r.ok) throw new Error("gold");
          return r.json();
        }),
        fetchWithTimeout(`${API_URL}/market/stocks`).then((r) => {
          if (!r.ok) throw new Error("stocks");
          return r.json();
        }),
      ]);

      if (cancelled) return;

      if (cryptoResult.status === "fulfilled") setCrypto(cryptoResult.value);
      if (forexResult.status === "fulfilled") setForex(forexResult.value);
      if (goldResult.status === "fulfilled") {
        const goldData: GoldResponse = goldResult.value;
        const siraliKalemler = ["Gram Altın", "Çeyrek Altın", "Yarım Altın", "Tam Altın", "Gümüş"];
        setGold(
          siraliKalemler
            .map((name) => goldData.result.find((item) => item.name === name))
            .filter((item): item is GoldItem => item !== undefined)
        );
      }
      if (stocksResult.status === "fulfilled") {
        const stocksData: StockResponse = stocksResult.value;
        setStocks(stocksData.result.slice(0, 5));
      }

      // Yatirim fonlari: her biri ayri bir TEFAS cagrisi (backend'de onbellekli).
      const fundResults = await Promise.allSettled(
        FUND_CODES.map((code) =>
          fetchWithTimeout(`${API_URL}/market/fund?code=${code}`).then((r) => {
            if (!r.ok) throw new Error("fund");
            return r.json() as Promise<FundItem>;
          })
        )
      );
      if (!cancelled) {
        const loadedFunds = fundResults
          .filter(
            (r): r is PromiseFulfilledResult<FundItem> =>
              r.status === "fulfilled" && r.value?.price != null
          )
          .map((r) => r.value);
        if (loadedFunds.length > 0) setFunds(loadedFunds);
      }

      const failedCount = [cryptoResult, forexResult, goldResult, stocksResult].filter(
        (r) => r.status === "rejected"
      ).length;
      if (failedCount > 0) {
        setError(
          failedCount === 4
            ? t("error.marketAll")
            : t("error.marketSome")
        );
      }
    }

    loadMarketData();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, retryCount]);

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
              <LanguageSwitcher className="mr-1" />
              <Link href="/blog" className={NAV_LINK_CLASS}>
                {t("nav.blog")}
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/" className={NAV_LINK_CLASS}>
                    {t("nav.prices")}
                  </Link>
                  <Link href="/charts" className={NAV_LINK_CLASS}>
                    {t("nav.charts")}
                  </Link>
                  <Link href="/portfolio" className={NAV_LINK_CLASS}>
                    {t("nav.portfolio")}
                  </Link>
                  <Link href="/alerts" className={NAV_LINK_CLASS}>
                    {t("nav.alerts")}
                  </Link>
                  <Link href="/advisor" className={NAV_LINK_CLASS}>
                    {t("nav.advisor")}
                  </Link>
                  <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={NAV_LINK_CLASS}>
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    className="ml-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t("nav.menuClose") : t("nav.menuOpen")}
              className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:hidden">
              <div className="flex justify-center pb-1">
                <LanguageSwitcher />
              </div>
              <Link href="/blog" className={`${NAV_LINK_CLASS} text-center`} onClick={() => setMenuOpen(false)}>
                {t("nav.blog")}
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/" className={`${NAV_LINK_CLASS} text-center`} onClick={() => setMenuOpen(false)}>
                    {t("nav.prices")}
                  </Link>
                  <Link href="/charts" className={`${NAV_LINK_CLASS} text-center`} onClick={() => setMenuOpen(false)}>
                    {t("nav.charts")}
                  </Link>
                  <Link
                    href="/portfolio"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.portfolio")}
                  </Link>
                  <Link
                    href="/alerts"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.alerts")}
                  </Link>
                  <Link
                    href="/advisor"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.advisor")}
                  </Link>
                  <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* ZIYARETCI (giris yapmamis) -> LANDING */}
        {!isLoggedIn && (
          <>
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
              {t("hero.badge")}
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
              {t("hero.titleLead")}{" "}
              <span className="text-emerald-400">{t("hero.titleEmphasis")}</span>{" "}
              {t("hero.titleTail")}
            </h2>
            <p className="mt-4 max-w-xl text-sm text-indigo-200/80 sm:text-base">
              {t("hero.subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/portfolio"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-950 shadow-sm transition hover:bg-indigo-50"
                >
                  {t("hero.ctaPortfolio")}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t("hero.ctaLogin")}
                </Link>
              )}
            </div>

            <p className="mt-4 text-xs text-indigo-300/60">
              {t("hero.disclaimer")}
            </p>
          </div>
        </section>

        {/* OZELLIKLER - uygulamanin can alici kisimlari */}
        <section>
          <h3 className="text-center text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            {t("features.title")}
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">
            {t("features.subtitle")}
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
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t(f.titleKey)}</h4>
                  <p className="mt-1 text-sm text-zinc-500">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

          </>
        )}

        {/* CANLI FIYATLAR - yalnizca giris yapmis kullaniciya */}
        {isLoggedIn && (
          <>
            {error && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  {t("common.retry")}
                </button>
              </div>
            )}

            <div className="-mb-2 flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t("prices.heading")}
              </h3>
              <span className="text-xs text-zinc-400">{t("prices.tag")}</span>
            </div>

            <section className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MarketCard title={t("card.gold")} accent="#eda100" icon={<GemIcon />}>
                {gold ? (
                  <ul className="flex flex-col gap-2">
                    {gold.map((item) => (
                      <li key={item.name} className="flex w-full items-center justify-between text-sm">
                        <span className="text-zinc-500">{item.name}</span>
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {formatNumber(item.selling)}
                          </span>
                          {item.rate !== undefined && (
                            <span
                              className={`text-xs font-medium ${
                                item.rate >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {item.rate >= 0 ? "+" : ""}
                              {item.rate}%
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Loading />
                )}
              </MarketCard>

              <MarketCard title={t("card.forex")} accent="#1baf7a" icon={<ExchangeIcon />}>
                {forex ? (
                  <ul className="flex flex-col gap-2">
                    <li className="flex w-full items-center justify-between text-sm">
                      <span className="text-zinc-500">USD/TRY</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatNumber(forex.rates.TRY)}
                      </span>
                    </li>
                    {forex.rates.EUR ? (
                      <li className="flex w-full items-center justify-between text-sm">
                        <span className="text-zinc-500">EUR/TRY</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {formatNumber(forex.rates.TRY / forex.rates.EUR)}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <Loading />
                )}
              </MarketCard>

              <MarketCard title={t("card.crypto")} accent="#2a78d6" icon={<CoinIcon />}>
                {crypto ? (
                  <ul className="flex flex-col gap-2">
                    {Object.entries(crypto)
                      .filter(([, price]) => typeof price?.usd === "number")
                      .map(([coin, price]) => (
                        <li key={coin} className="flex w-full items-center justify-between text-sm">
                          <span className="capitalize text-zinc-500">{coin}</span>
                          <span className="flex items-baseline gap-2">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              ${formatNumber(price.usd)}
                            </span>
                            {price.usd_24h_change !== undefined && (
                              <span
                                className={`text-xs font-medium ${
                                  price.usd_24h_change >= 0 ? "text-emerald-600" : "text-red-500"
                                }`}
                              >
                                {price.usd_24h_change >= 0 ? "+" : ""}
                                {price.usd_24h_change.toFixed(2)}%
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <Loading />
                )}
              </MarketCard>

              <MarketCard title={t("card.stocks")} accent="#008300" icon={<ChartIcon />}>
                {stocks ? (
                  <ul className="flex flex-col gap-2">
                    {stocks.map((item) => (
                      <li key={item.name} className="flex w-full items-center justify-between text-sm">
                        <span className="text-zinc-500">{item.name}</span>
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {formatNumber(item.price)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              item.rate >= 0 ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {item.rate >= 0 ? "+" : ""}
                            {item.rate}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Loading />
                )}
              </MarketCard>

              <MarketCard title={t("card.funds")} accent="#7c3aed" icon={<FundIcon />}>
                {funds ? (
                  <ul className="flex flex-col gap-2">
                    {funds.map((f) => (
                      <li key={f.code} className="flex w-full items-center justify-between text-sm">
                        <span className="text-zinc-500" title={f.name}>
                          {f.code}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {f.price != null ? formatNumber(f.price) : "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Loading />
                )}
              </MarketCard>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MarketCard({
  title,
  accent,
  icon,
  children,
}: {
  title: string;
  accent: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-h-[280px]"
      style={{ borderTopWidth: "3px", borderTopColor: accent }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span style={{ color: accent }}>{icon}</span>
        <h2 className="text-sm font-semibold text-zinc-500">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.4 1.2-2.5 2.5-2.5s2.5 1 2.5 2c0 1.5-2 2-2.5 2.5c-1 1-2.5 1.5-2.5 3s1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
    </svg>
  );
}

function ExchangeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h13M17 7l-3-3M17 7l-3 3" />
      <path d="M20 17H7M7 17l3-3M7 17l3 3" />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18M9 3l3 6 3-6M9.5 9L12 21l2.5-12" />
    </svg>
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

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

function FundIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l3-3 3 2 4-5" />
      <circle cx="20" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function Loading() {
  const { t } = useI18n();
  return <p className="text-sm text-zinc-400">{t("common.loading")}</p>;
}
