"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getToken } from "@/lib/auth";
import PriceChart from "@/components/PriceChart";
import {
  CUSTOM_SYMBOL,
  SYMBOLS_BY_TYPE,
  CRYPTO_IDS,
  GOLD_NAMES,
  getSymbolLabel,
  getYahooTicker,
  getChartCurrencyLabel,
} from "@/lib/marketSymbols";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

function formatMoney(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} TL`;
}

type Holding = {
  id: number;
  asset_symbol: string;
  asset_type: string;
  quantity: number;
  purchase_price: number;
  is_active: boolean;
  removed_at: string | null;
};

export default function PortfolioPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<number, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedChartId, setExpandedChartId] = useState<number | null>(null);
  const [history, setHistory] = useState<Holding[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [assetType, setAssetType] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inflationRate, setInflationRate] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/market/inflation`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setInflationRate(data?.annual_rate ?? null))
      .catch(() => setInflationRate(null));
  }, []);

  async function loadHoldings(token: string) {
    const res = await fetch(`${API_URL}/portfolio/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Portfoy yuklenemedi.");
    }
    setHoldings(await res.json());
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadHoldings(token).catch(() => setError("Portfoy yuklenirken bir hata olustu."));
  }, [router]);

  useEffect(() => {
    if (!holdings || holdings.length === 0) return;

    async function loadCurrentPrices() {
      const prices: Record<number, number> = {};

      const usdTryRes = await fetch(`${API_URL}/market/forex?base=USD&symbols=TRY`);
      const usdTryData = await usdTryRes.json();
      const usdToTry: number = usdTryData.rates.TRY;

      const cryptoSymbols = [
        ...new Set(
          holdings!.filter((h) => h.asset_type === "kripto").map((h) => h.asset_symbol)
        ),
      ];
      const cryptoIds = cryptoSymbols.map((s) => CRYPTO_IDS[s]).filter(Boolean);
      const cryptoPrices: Record<string, { usd: number }> =
        cryptoIds.length > 0
          ? await (
              await fetch(`${API_URL}/market/crypto?coins=${cryptoIds.join(",")}`)
            ).json()
          : {};

      const dovizSymbols = [
        ...new Set(holdings!.filter((h) => h.asset_type === "doviz").map((h) => h.asset_symbol)),
      ];
      const dovizRates: Record<string, number> = {};
      await Promise.all(
        dovizSymbols.map(async (symbol) => {
          const res = await fetch(`${API_URL}/market/forex?base=${symbol}&symbols=TRY`);
          const data = await res.json();
          dovizRates[symbol] = data.rates.TRY;
        })
      );

      const needsGold = holdings!.some((h) => h.asset_type === "altin");
      const goldData = needsGold
        ? await (await fetch(`${API_URL}/market/gold`)).json()
        : null;

      const needsStocks = holdings!.some((h) => h.asset_type === "hisse");
      const stockData = needsStocks
        ? await (await fetch(`${API_URL}/market/stocks`)).json()
        : null;

      for (const h of holdings!) {
        if (h.asset_type === "kripto") {
          const id = CRYPTO_IDS[h.asset_symbol];
          if (id && cryptoPrices[id]) {
            prices[h.id] = cryptoPrices[id].usd * usdToTry;
          }
        } else if (h.asset_type === "doviz") {
          if (dovizRates[h.asset_symbol]) {
            prices[h.id] = dovizRates[h.asset_symbol];
          }
        } else if (h.asset_type === "altin" && goldData) {
          const goldName = GOLD_NAMES[h.asset_symbol];
          const item = goldData.result.find((g: { name: string }) => g.name === goldName);
          if (item) prices[h.id] = item.selling;
        } else if (h.asset_type === "hisse" && stockData) {
          const item = stockData.result.find(
            (s: { name: string }) => s.name === h.asset_symbol
          );
          if (item) prices[h.id] = item.price;
        }
      }

      setCurrentPrices(prices);
      setLastUpdated(new Date());
    }

    loadCurrentPrices().catch(() => {
      /* canli fiyat alinamazsa sessizce yoksay, portfoy yine de gosterilir */
    });

    const intervalId = setInterval(() => {
      loadCurrentPrices().catch(() => {
        /* canli fiyat alinamazsa sessizce yoksay, portfoy yine de gosterilir */
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [holdings]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const finalSymbol = assetSymbol === CUSTOM_SYMBOL ? customSymbol : assetSymbol;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/portfolio/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_symbol: finalSymbol,
          asset_type: assetType,
          quantity: Number(quantity),
          purchase_price: Number(purchasePrice),
        }),
      });
      if (!res.ok) {
        throw new Error("Varlik eklenemedi.");
      }
      setAssetType("");
      setAssetSymbol("");
      setCustomSymbol("");
      setQuantity("");
      setPurchasePrice("");
      await loadHoldings(token);
    } catch {
      setError("Varlik eklenirken bir hata olustu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/portfolio/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gecmis yuklenemedi.");
      setHistory(await res.json());
      setShowHistory(true);
    } catch {
      setError("Islem gecmisi yuklenirken bir hata olustu.");
    }
  }

  async function handleDownload(format: "csv" | "pdf") {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/portfolio/report?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Rapor olusturulamadi.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "csv" ? "portfoy_raporu.csv" : "portfoy_raporu.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Rapor indirilirken bir hata olustu.");
    }
  }

  async function handleDelete(id: number) {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/portfolio/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Silinemedi.");
      }
      await loadHoldings(token);
    } catch {
      setError("Silme islemi basarisiz oldu.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Portfoyum</h1>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={toggleHistory} className="text-sm font-medium text-zinc-500">
              {showHistory ? "Gecmisi gizle" : "Islem Gecmisi"}
            </button>
            <Link href="/alerts" className="text-sm font-medium text-zinc-500">
              Alarmlarim
            </Link>
            <Link href="/" className="text-sm font-medium text-zinc-500">
              Dashboard&apos;a don
            </Link>
          </div>
        </div>

        {lastUpdated && (
          <p className="-mt-4 text-xs text-zinc-400">
            Fiyatlar 30 saniyede bir guncelleniyor - son guncelleme:{" "}
            {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {holdings && holdings.length > 0 && (
          <PortfolioSummary
            holdings={holdings}
            currentPrices={currentPrices}
            inflationRate={inflationRate}
          />
        )}

        {holdings && holdings.length > 0 && <PortfolioPerformanceChart />}

        {holdings && holdings.length > 0 && (
          <AssetDistribution holdings={holdings} currentPrices={currentPrices} />
        )}

        {holdings && holdings.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload("pdf")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              PDF Indir
            </button>
            <button
              onClick={() => handleDownload("csv")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              CSV Indir (Excel)
            </button>
          </div>
        )}

        <HoldingsTable
          holdings={holdings}
          currentPrices={currentPrices}
          expandedChartId={expandedChartId}
          onToggleChart={(id) => setExpandedChartId(expandedChartId === id ? null : id)}
          onDelete={handleDelete}
        />

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold text-zinc-500">Yeni Varlik Ekle</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Tur (varlik kategorisi)
              <select
                value={assetType}
                onChange={(e) => {
                  setAssetType(e.target.value);
                  setAssetSymbol("");
                  setCustomSymbol("");
                }}
                required
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="" disabled>
                  Kategori sec
                </option>
                <option value="kripto">Kripto</option>
                <option value="doviz">Doviz</option>
                <option value="altin">Altin / Gumus</option>
                <option value="hisse">Hisse Senedi</option>
                <option value="gayrimenkul">Gayrimenkul</option>
                <option value="diger">Diger</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Sembol (varligin kodu)
              <select
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value)}
                required
                disabled={!assetType}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="" disabled>
                  {assetType ? "Sembol sec" : "Once tur sec"}
                </option>
                {(SYMBOLS_BY_TYPE[assetType] ?? []).map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {getSymbolLabel(assetType, symbol)}
                  </option>
                ))}
                <option value={CUSTOM_SYMBOL}>Diger (elle yaz)</option>
              </select>
              {assetSymbol === CUSTOM_SYMBOL && (
                <input
                  placeholder="Ozel sembol yaz"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  required
                  className="mt-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Miktar (kac adet/birim aldin)
              <input
                type="number"
                step="any"
                placeholder="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Alis Fiyati (birim basina, TL)
              <input
                type="number"
                step="any"
                placeholder="60000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="self-end rounded-xl bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50 disabled:hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:hover:bg-zinc-50"
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>

        {showHistory && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-zinc-500">Islem Gecmisi</p>
            {history === null && <p className="text-sm text-zinc-400">Yukleniyor...</p>}
            {history?.length === 0 && (
              <p className="text-sm text-zinc-400">Henuz bir islem gecmisi yok.</p>
            )}
            {history?.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 text-sm dark:border-zinc-900 dark:bg-zinc-950"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {getSymbolLabel(h.asset_type, h.asset_symbol)}
                  </span>{" "}
                  <span className="text-zinc-500">
                    {h.quantity} adet, alis fiyati {h.purchase_price}
                  </span>
                </div>
                {h.is_active ? (
                  <span className="text-xs font-medium text-emerald-600">Aktif</span>
                ) : (
                  <span className="text-xs font-medium text-zinc-400">
                    Silindi {h.removed_at ? `(${new Date(h.removed_at).toLocaleDateString()})` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PortfolioSummary({
  holdings,
  currentPrices,
  inflationRate,
}: {
  holdings: Holding[];
  currentPrices: Record<number, number>;
  inflationRate: number | null;
}) {
  let totalInvested = 0;
  let totalCurrent = 0;
  let pricedCount = 0;

  for (const h of holdings) {
    totalInvested += h.purchase_price * h.quantity;
    const currentPrice = currentPrices[h.id];
    if (currentPrice !== undefined) {
      totalCurrent += currentPrice * h.quantity;
      pricedCount += 1;
    } else {
      totalCurrent += h.purchase_price * h.quantity;
    }
  }

  const gainAmount = totalCurrent - totalInvested;
  const gainPercent = totalInvested > 0 ? (gainAmount / totalInvested) * 100 : 0;
  const isPositive = gainAmount >= 0;
  const allPriced = pricedCount === holdings.length;

  // Fisher denklemi: reel getiri = (1 + nominal getiri) / (1 + enflasyon) - 1
  const realGainPercent =
    inflationRate !== null && totalInvested > 0
      ? ((1 + gainPercent / 100) / (1 + inflationRate / 100) - 1) * 100
      : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-2 text-xs font-semibold text-zinc-500">Portfoy Ozeti</p>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-zinc-400">Toplam Deger</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 2 })} TL
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Toplam Kar/Zarar (Nominal)</p>
          <p className={`text-xl font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? "+" : ""}
            {gainAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} TL ({isPositive ? "+" : ""}
            {gainPercent.toFixed(2)}%)
          </p>
        </div>
        {realGainPercent !== null && (
          <div>
            <p className="text-xs text-zinc-400">Enflasyona Gore Reel Getiri</p>
            <p
              className={`text-xl font-semibold ${realGainPercent >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {realGainPercent >= 0 ? "+" : ""}
              {realGainPercent.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
      {!allPriced && (
        <p className="mt-2 text-xs text-zinc-400">
          Bazi varliklar icin canli fiyat bulunamadi, bu ozet tam kesin olmayabilir.
        </p>
      )}
      {realGainPercent !== null && (
        <p className="mt-2 text-xs text-zinc-400">
          Reel getiri, TUIK&apos;in son acikladigi yillik %{inflationRate?.toFixed(2)} TUFE oranina gore
          hesaplanir.
        </p>
      )}
    </div>
  );
}

type PortfolioSnapshot = {
  snapshot_date: string;
  total_value: number;
  total_invested: number;
};

function PortfolioPerformanceChart() {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[] | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/portfolio/performance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSnapshots(data))
      .catch(() => setSnapshots(null));
  }, []);

  if (!snapshots || snapshots.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-3 text-xs font-semibold text-zinc-500">Portfoy Performans Gecmisi</p>
      {snapshots.length < 2 ? (
        <p className="text-sm text-zinc-400">
          Trend grafigi icin veri birikiyor, birkac gun sonra burada gorunecek.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={snapshots} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="snapshot_date"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
              }
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              width={64}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} TL`,
                "Toplam Deger",
              ]}
              labelFormatter={(d: string) => new Date(d).toLocaleDateString("tr-TR")}
            />
            <Line type="monotone" dataKey="total_value" stroke="#2a78d6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  kripto: "#2a78d6",
  doviz: "#1baf7a",
  altin: "#eda100",
  hisse: "#008300",
  gayrimenkul: "#4a3aa7",
  diger: "#e34948",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  kripto: "Kripto",
  doviz: "Doviz",
  altin: "Altin / Gumus",
  hisse: "Hisse Senedi (BIST)",
  gayrimenkul: "Gayrimenkul (GYO)",
  diger: "Diger",
};

function AssetDistribution({
  holdings,
  currentPrices,
}: {
  holdings: Holding[];
  currentPrices: Record<number, number>;
}) {
  const valueByType: Record<string, number> = {};
  let total = 0;

  for (const h of holdings) {
    const price = currentPrices[h.id] ?? h.purchase_price;
    const value = price * h.quantity;
    valueByType[h.asset_type] = (valueByType[h.asset_type] ?? 0) + value;
    total += value;
  }

  if (total <= 0) return null;

  const rows = Object.entries(valueByType)
    .map(([type, value]) => ({ type, value, percent: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-3 text-xs font-semibold text-zinc-500">Varlik Dagilimi</p>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.type} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {ASSET_TYPE_LABELS[row.type] ?? row.type}
              </span>
              <span className="text-zinc-500">{row.percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.percent}%`,
                  backgroundColor: ASSET_TYPE_COLORS[row.type] ?? "#898781",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingsTable({
  holdings,
  currentPrices,
  expandedChartId,
  onToggleChart,
  onDelete,
}: {
  holdings: Holding[] | null;
  currentPrices: Record<number, number>;
  expandedChartId: number | null;
  onToggleChart: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (holdings === null) {
    return <p className="text-sm text-zinc-400">Yukleniyor...</p>;
  }

  if (holdings.length === 0) {
    return <p className="text-sm text-zinc-400">Henuz portfoyune varlik eklemedin.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-semibold text-zinc-400 dark:border-zinc-900">
            <th className="px-4 py-3 font-semibold">Varlik</th>
            <th className="px-4 py-3 font-semibold">Miktar</th>
            <th className="px-4 py-3 font-semibold">Ort. Alis Fiyati</th>
            <th className="px-4 py-3 font-semibold">Guncel Fiyat</th>
            <th className="px-4 py-3 font-semibold">Toplam Deger</th>
            <th className="px-4 py-3 font-semibold">Kar/Zarar (%)</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const currentPrice = currentPrices[h.id];
            const totalValue = currentPrice !== undefined ? currentPrice * h.quantity : null;
            const gainPercent =
              currentPrice !== undefined
                ? ((currentPrice - h.purchase_price) / h.purchase_price) * 100
                : null;
            const isPositive = gainPercent !== null && gainPercent >= 0;
            const yahooTicker = getYahooTicker(h.asset_type, h.asset_symbol);
            const isChartOpen = expandedChartId === h.id;

            return (
              <Fragment key={h.id}>
                <tr
                  onClick={() => yahooTicker && onToggleChart(h.id)}
                  className={`border-b border-zinc-50 last:border-0 dark:border-zinc-900 ${
                    yahooTicker ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {getSymbolLabel(h.asset_type, h.asset_symbol)}
                    </span>{" "}
                    <span className="text-xs text-zinc-400">({h.asset_type})</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{h.quantity}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatMoney(h.purchase_price)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {currentPrice !== undefined ? formatMoney(currentPrice) : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {totalValue !== null ? formatMoney(totalValue) : "-"}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      gainPercent === null
                        ? "text-zinc-400"
                        : isPositive
                          ? "text-emerald-600"
                          : "text-red-500"
                    }`}
                  >
                    {gainPercent !== null
                      ? `${isPositive ? "+" : ""}${gainPercent.toFixed(2)}%`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(h.id);
                      }}
                      aria-label="Varligi sil"
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
                {isChartOpen && yahooTicker && (
                  <tr className="border-b border-zinc-50 last:border-0 dark:border-zinc-900">
                    <td colSpan={7} className="bg-zinc-50/60 px-4 pb-4 pt-2 dark:bg-zinc-900/30">
                      <p className="mb-2 text-xs text-zinc-400">Son 1 yil fiyat trendi</p>
                      <PriceChart symbol={yahooTicker} currencyLabel={getChartCurrencyLabel(h.asset_type)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" />
    </svg>
  );
}
