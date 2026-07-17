"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { clearToken, getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const NAV_LINK_CLASS =
  "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
const NAV_LINK_ACTIVE_CLASS =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900";

const API_URL = getApiUrl();

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
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

export default function Home() {
  const [crypto, setCrypto] = useState<CryptoPrices | null>(null);
  const [forex, setForex] = useState<ForexRates | null>(null);
  const [gold, setGold] = useState<GoldItem[] | null>(null);
  const [stocks, setStocks] = useState<StockItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    async function loadMarketData() {
      try {
        setError(null);
        const [cryptoRes, forexRes, goldRes, stocksRes] = await Promise.all([
          fetchWithTimeout(`${API_URL}/market/crypto?coins=bitcoin,ethereum`),
          fetchWithTimeout(`${API_URL}/market/forex?base=USD&symbols=TRY,EUR`),
          fetchWithTimeout(`${API_URL}/market/gold`),
          fetchWithTimeout(`${API_URL}/market/stocks`),
        ]);

        if (!cryptoRes.ok || !forexRes.ok || !goldRes.ok || !stocksRes.ok) {
          throw new Error("Piyasa verileri alinamadi.");
        }

        setCrypto(await cryptoRes.json());
        setForex(await forexRes.json());
        const goldData: GoldResponse = await goldRes.json();
        const oncelikliKalemler = ["Gram Altın", "Çeyrek Altın", "Yarım Altın", "Gümüş"];
        setGold(
          goldData.result.filter((item) => oncelikliKalemler.includes(item.name))
        );
        const stocksData: StockResponse = await stocksRes.json();
        setStocks(stocksData.result.slice(0, 5));
      } catch {
        setError("Piyasa verileri yuklenirken bir hata olustu.");
      }
    }

    loadMarketData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="shrink-0 whitespace-nowrap text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Akilli Yatirim Danismani
            </h1>

            <div className="hidden flex-wrap items-center justify-end gap-1 sm:flex">
              <span className={NAV_LINK_ACTIVE_CLASS}>Guncel Fiyatlar</span>
              <Link href="/charts" className={NAV_LINK_CLASS}>
                Grafikler
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/portfolio" className={NAV_LINK_CLASS}>
                    Portfoyum
                  </Link>
                  <Link href="/alerts" className={NAV_LINK_CLASS}>
                    Alarmlar
                  </Link>
                  <Link href="/advisor" className={NAV_LINK_CLASS}>
                    Akilli Danisman
                  </Link>
                  <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    Cikis Yap
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={NAV_LINK_CLASS}>
                    Giris Yap
                  </Link>
                  <Link
                    href="/register"
                    className="ml-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Kayit Ol
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Menuyu kapat" : "Menuyu ac"}
              className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:hidden">
              <span className={`${NAV_LINK_ACTIVE_CLASS} text-center`}>Guncel Fiyatlar</span>
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
                    Portfoyum
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
                    Akilli Danisman
                  </Link>
                  <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogoutIcon />
                    Cikis Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`${NAV_LINK_CLASS} text-center`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Giris Yap
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    onClick={() => setMenuOpen(false)}
                  >
                    Kayit Ol
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a78d6] to-[#1c5cab] px-6 py-10 text-white shadow-lg dark:from-[#184f95] dark:to-[#0d366b] sm:px-10">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Guncel piyasa fiyatlari
          </h2>
          <p className="mt-2 max-w-xl text-sm text-blue-100">
            Kripto, doviz, altin ve BIST hisselerinin canli fiyatlari. Kendi
            yatirimlarinizi ve kar/zararinizi gormek icin{" "}
            <span className="font-semibold">Portfoyum</span> sayfasina gecin.
          </p>
        </section>

        {error && <p className="text-red-500">{error}</p>}

        <section className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MarketCard title="Kripto (USD)" accent="#2a78d6" icon={<CoinIcon />}>
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

          <MarketCard title="Doviz Kurlari" accent="#1baf7a" icon={<ExchangeIcon />}>
            {forex ? (
              <ul className="flex flex-col gap-2">
                {Object.entries(forex.rates).map(([symbol, rate]) => (
                  <li key={symbol} className="flex w-full items-center justify-between text-sm">
                    <span className="text-zinc-500">USD/{symbol}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatNumber(rate)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Loading />
            )}
          </MarketCard>

          <MarketCard title="Altin & Gumus (TL)" accent="#eda100" icon={<GemIcon />}>
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

          <MarketCard title="Borsa (BIST)" accent="#008300" icon={<ChartIcon />}>
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
        </section>
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
      className="min-h-[280px] rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
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

function Loading() {
  return <p className="text-sm text-zinc-400">Yukleniyor...</p>;
}
