"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SYMBOLS_BY_TYPE,
  getSymbolLabel,
  getYahooTicker,
  getChartCurrencyLabel,
} from "@/lib/marketSymbols";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

const UP_COLOR = "#10b981";
const DOWN_COLOR = "#ef4444";

type HistoryPoint = { date: string; price: number };

type TabKey = "kripto" | "doviz" | "altin" | "borsa";

const TABS: { key: TabKey; label: string }[] = [
  { key: "kripto", label: "Kripto" },
  { key: "doviz", label: "Doviz" },
  { key: "altin", label: "Altin & Gumus" },
  { key: "borsa", label: "BIST 100" },
];

const TAB_ASSET_TYPES: Record<TabKey, string[]> = {
  kripto: ["kripto"],
  doviz: ["doviz"],
  altin: ["altin"],
  borsa: ["hisse", "gayrimenkul"],
};

const HERO_RANGES = [
  { label: "1A", range: "1mo", interval: "1d" },
  { label: "3A", range: "3mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1wk" },
] as const;

type AssetRef = {
  assetType: string;
  symbol: string;
  ticker: string;
  label: string;
  currency: string;
};

function buildAssetList(assetTypes: string[]): AssetRef[] {
  const list: AssetRef[] = [];
  for (const assetType of assetTypes) {
    for (const symbol of SYMBOLS_BY_TYPE[assetType]) {
      const ticker = getYahooTicker(assetType, symbol);
      if (!ticker) continue;
      list.push({
        assetType,
        symbol,
        ticker,
        label: getSymbolLabel(assetType, symbol),
        currency: getChartCurrencyLabel(assetType),
      });
    }
  }
  return list;
}

function formatPrice(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: value < 10 ? 4 : 2 });
}

function formatHeroPrice(value: number, currency: string): string {
  return currency === "USD" ? `$${formatPrice(value)}` : `${formatPrice(value)} TL`;
}

function trendOf(points: HistoryPoint[]): boolean {
  if (points.length < 2) return true;
  return points[points.length - 1].price >= points[0].price;
}

function changeOf(points: HistoryPoint[]): number | null {
  if (points.length < 2) return null;
  const prev = points[points.length - 2].price;
  const last = points[points.length - 1].price;
  return ((last - prev) / prev) * 100;
}

async function fetchHistory(ticker: string, range: string, interval: string): Promise<HistoryPoint[]> {
  const res = await fetch(
    `${API_URL}/market/history?symbol=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`
  );
  if (!res.ok) throw new Error("history fetch failed");
  const data = await res.json();
  return data.points as HistoryPoint[];
}

export default function ChartsPage() {
  const [tab, setTab] = useState<TabKey>("kripto");
  const [selected, setSelected] = useState<AssetRef | null>(null);
  const [cardHistory, setCardHistory] = useState<Record<string, HistoryPoint[]>>({});
  const [heroRangeIndex, setHeroRangeIndex] = useState(0);
  const [heroPoints, setHeroPoints] = useState<HistoryPoint[] | null>(null);
  const [heroLoading, setHeroLoading] = useState(false);

  const assets = useMemo(() => buildAssetList(TAB_ASSET_TYPES[tab]), [tab]);
  const heroRange = HERO_RANGES[heroRangeIndex];

  useEffect(() => {
    setSelected(assets[0] ?? null);
  }, [assets]);

  useEffect(() => {
    let cancelled = false;
    setCardHistory({});

    async function loadAll() {
      const results = await Promise.all(
        assets.map(async (asset) => {
          try {
            const points = await fetchHistory(asset.ticker, "1mo", "1d");
            return [asset.ticker, points] as const;
          } catch {
            return [asset.ticker, null] as const;
          }
        })
      );
      if (cancelled) return;
      const next: Record<string, HistoryPoint[]> = {};
      for (const [ticker, points] of results) {
        if (points && points.length > 0) next[ticker] = points;
      }
      setCardHistory(next);
    }

    if (assets.length > 0) loadAll();
    return () => {
      cancelled = true;
    };
  }, [assets]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setHeroLoading(true);
    setHeroPoints(null);

    fetchHistory(selected.ticker, heroRange.range, heroRange.interval)
      .then((points) => {
        if (!cancelled) setHeroPoints(points);
      })
      .catch(() => {
        if (!cancelled) setHeroPoints([]);
      })
      .finally(() => {
        if (!cancelled) setHeroLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, heroRange.range, heroRange.interval]);

  const selectedCardHistory = selected ? cardHistory[selected.ticker] ?? [] : [];
  const headlinePrice =
    selectedCardHistory.length > 0 ? selectedCardHistory[selectedCardHistory.length - 1].price : null;
  const headlineChange = changeOf(selectedCardHistory);
  const heroTrendUp = heroPoints ? trendOf(heroPoints) : true;
  const heroColor = heroTrendUp ? UP_COLOR : DOWN_COLOR;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-black sm:px-6 sm:py-10">
      <main className="mx-auto flex max-w-6xl flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Grafikler</h1>
          <Link href="/" className="text-sm font-medium text-zinc-500">
            Dashboard&apos;a don
          </Link>
        </div>

        {/* HERO */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-lg dark:bg-zinc-950 sm:p-6">
          {selected ? (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Detayli Analiz</p>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                    {selected.label}
                  </h2>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {headlinePrice !== null ? formatHeroPrice(headlinePrice, selected.currency) : "..."}
                    </span>
                    {headlineChange !== null && (
                      <span
                        className={`text-base font-semibold ${
                          headlineChange >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {headlineChange >= 0 ? "▲ +" : "▼ "}
                        {headlineChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                  {HERO_RANGES.map((opt, i) => (
                    <button
                      key={opt.label}
                      onClick={() => setHeroRangeIndex(i)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        i === heroRangeIndex
                          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <HeroChart points={heroPoints} loading={heroLoading} color={heroColor} currency={selected.currency} />
            </>
          ) : (
            <p className="text-sm text-zinc-400">Yukleniyor...</p>
          )}
        </div>

        {/* TABS */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-zinc-900 text-white shadow-md dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-500 shadow-sm hover:text-zinc-900 dark:bg-zinc-950 dark:hover:text-zinc-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ASSET GRID */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset) => {
            const points = cardHistory[asset.ticker] ?? [];
            const lastPrice = points.length > 0 ? points[points.length - 1].price : null;
            const change = changeOf(points);
            const isSelected = selected?.ticker === asset.ticker;

            return (
              <button
                key={asset.ticker}
                onClick={() => setSelected(asset)}
                className={`flex flex-col gap-1 rounded-xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md dark:bg-zinc-950 ${
                  isSelected ? "ring-2 ring-[#2a78d6]" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {asset.label}
                  </span>
                  {change !== null && (
                    <span
                      className={`text-xs font-semibold ${
                        change >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-sm text-zinc-500">
                  {lastPrice !== null ? formatHeroPrice(lastPrice, asset.currency) : "Yukleniyor..."}
                </span>
                <MiniSparkline points={points} />
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function HeroChart({
  points,
  loading,
  color,
  currency,
}: {
  points: HistoryPoint[] | null;
  loading: boolean;
  color: string;
  currency: string;
}) {
  const gradientId = useId().replace(/:/g, "");

  if (loading || !points) {
    return <div className="flex h-[340px] items-center justify-center text-sm text-zinc-400">Grafik yukleniyor...</div>;
  }

  if (points.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center text-sm text-zinc-400">
        Bu varlik icin grafik verisi bulunamadi.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          minTickGap={48}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
        />
        <YAxis
          domain={["auto", "auto"]}
          axisLine={false}
          tickLine={false}
          width={70}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickFormatter={(v: number) => formatPrice(v)}
        />
        <Tooltip content={<HeroTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function HeroTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-zinc-400">{label}</p>
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
        {formatHeroPrice(payload[0].value, currency)}
      </p>
    </div>
  );
}

function MiniSparkline({ points }: { points: HistoryPoint[] }) {
  const gradientId = useId().replace(/:/g, "");

  if (points.length < 2) {
    return <div className="h-14 w-full" />;
  }

  const color = trendOf(points) ? UP_COLOR : DOWN_COLOR;

  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
