"use client";

import Link from "next/link";
import PriceChart from "@/components/PriceChart";
import {
  SYMBOLS_BY_TYPE,
  CHART_CATEGORY_LABELS,
  getSymbolLabel,
  getYahooTicker,
  getChartCurrencyLabel,
} from "@/lib/marketSymbols";

const CATEGORIES = ["kripto", "doviz", "altin", "hisse", "gayrimenkul"];

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Grafikler
          </h1>
          <Link href="/" className="text-sm font-medium text-zinc-500">
            Dashboard&apos;a don
          </Link>
        </div>

        <p className="text-sm text-zinc-500">
          Tum yatirim araclarinin son 1 yillik fiyat trendi.
        </p>

        {CATEGORIES.map((category) => (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {CHART_CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {SYMBOLS_BY_TYPE[category].map((symbol) => {
                const ticker = getYahooTicker(category, symbol);
                if (!ticker) return null;
                return (
                  <div
                    key={symbol}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {getSymbolLabel(category, symbol)}
                    </p>
                    <PriceChart symbol={ticker} currencyLabel={getChartCurrencyLabel(category)} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
