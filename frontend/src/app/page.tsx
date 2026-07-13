"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearToken, getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type CryptoPrices = Record<string, { usd: number }>;

type ForexRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type GoldItem = {
  name: string;
  buying: number;
  selling: number;
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

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  function handleLogout() {
    clearToken();
    setIsLoggedIn(false);
  }

  useEffect(() => {
    async function loadMarketData() {
      try {
        setError(null);
        const [cryptoRes, forexRes, goldRes, stocksRes] = await Promise.all([
          fetch(`${API_URL}/market/crypto?coins=bitcoin,ethereum`),
          fetch(`${API_URL}/market/forex?base=USD&symbols=TRY,EUR`),
          fetch(`${API_URL}/market/gold`),
          fetch(`${API_URL}/market/stocks`),
        ]);

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Akilli Yatirim Danismani
          </h1>

          {isLoggedIn ? (
            <div className="flex gap-2">
              <Link
                href="/portfolio"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                Portfoyum
              </Link>
              <Link
                href="/advisor"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                AI Danisman
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cikis Yap
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Giris Yap
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                Kayit Ol
              </Link>
            </div>
          )}
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MarketCard title="Kripto (USD)">
            {crypto ? (
              <ul className="flex flex-col gap-1">
                {Object.entries(crypto).map(([coin, price]) => (
                  <li key={coin} className="flex justify-between text-sm">
                    <span className="capitalize text-zinc-500">{coin}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      ${price.usd.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Loading />
            )}
          </MarketCard>

          <MarketCard title="Doviz (USD karsiligi)">
            {forex ? (
              <ul className="flex flex-col gap-1">
                {Object.entries(forex.rates).map(([symbol, rate]) => (
                  <li key={symbol} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{symbol}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {rate.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Loading />
            )}
          </MarketCard>

          <MarketCard title="Altin & Gumus (TL)">
            {gold ? (
              <ul className="flex flex-col gap-1">
                {gold.map((item) => (
                  <li key={item.name} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{item.name}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.selling.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Loading />
            )}
          </MarketCard>

          <MarketCard title="Borsa (BIST)">
            {stocks ? (
              <ul className="flex flex-col gap-1">
                {stocks.map((item) => (
                  <li key={item.name} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{item.name}</span>
                    <span
                      className={`font-medium ${
                        item.rate >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {item.price.toLocaleString()} ({item.rate}%)
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

function MarketCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-zinc-400">Yukleniyor...</p>;
}
