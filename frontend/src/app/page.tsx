"use client";

import { useEffect, useState } from "react";

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

export default function Home() {
  const [crypto, setCrypto] = useState<CryptoPrices | null>(null);
  const [forex, setForex] = useState<ForexRates | null>(null);
  const [gold, setGold] = useState<GoldItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const [cryptoRes, forexRes, goldRes] = await Promise.all([
          fetch(`${API_URL}/market/crypto?coins=bitcoin,ethereum`),
          fetch(`${API_URL}/market/forex?base=USD&symbols=TRY,EUR`),
          fetch(`${API_URL}/market/gold`),
        ]);

        setCrypto(await cryptoRes.json());
        setForex(await forexRes.json());
        const goldData: GoldResponse = await goldRes.json();
        setGold(goldData.result.slice(0, 4));
      } catch {
        setError("Piyasa verileri yuklenirken bir hata olustu.");
      }
    }

    loadMarketData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-4xl flex-col gap-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Akilli Yatirim Danismani
        </h1>

        {error && <p className="text-red-500">{error}</p>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          <MarketCard title="Altin (TL)">
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
