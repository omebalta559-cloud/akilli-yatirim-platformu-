"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Holding = {
  id: number;
  asset_symbol: string;
  asset_type: string;
  quantity: number;
  purchase_price: number;
};

export default function PortfolioPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<number, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedChartId, setExpandedChartId] = useState<number | null>(null);

  const [assetType, setAssetType] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      <main className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Portfoyum</h1>
          <Link href="/" className="text-sm font-medium text-zinc-500">
            Dashboard&apos;a don
          </Link>
        </div>

        {lastUpdated && (
          <p className="-mt-4 text-xs text-zinc-400">
            Fiyatlar 30 saniyede bir guncelleniyor - son guncelleme:{" "}
            {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold text-zinc-500">Yeni Varlik Ekle</h2>
          <div className="grid grid-cols-2 gap-3">
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
                  className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {holdings === null && <p className="text-sm text-zinc-400">Yukleniyor...</p>}
          {holdings?.length === 0 && (
            <p className="text-sm text-zinc-400">Henuz portfoyune varlik eklemedin.</p>
          )}
          {holdings?.map((h) => {
            const currentPrice = currentPrices[h.id];
            const gainAmount =
              currentPrice !== undefined ? (currentPrice - h.purchase_price) * h.quantity : null;
            const gainPercent =
              currentPrice !== undefined
                ? ((currentPrice - h.purchase_price) / h.purchase_price) * 100
                : null;
            const isPositive = gainAmount !== null && gainAmount >= 0;
            const yahooTicker = getYahooTicker(h.asset_type, h.asset_symbol);
            const isChartOpen = expandedChartId === h.id;

            return (
              <div
                key={h.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {getSymbolLabel(h.asset_type, h.asset_symbol)}{" "}
                      <span className="text-xs font-normal text-zinc-500">({h.asset_type})</span>
                    </p>
                    <p className="text-sm text-zinc-500">
                      {h.quantity} adet, alis fiyati {h.purchase_price}
                    </p>
                    {gainAmount !== null && gainPercent !== null ? (
                      <p
                        className={`text-sm font-medium ${
                          isPositive ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {gainAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} TL (
                        {isPositive ? "+" : ""}
                        {gainPercent.toFixed(2)}%)
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">Canli fiyat yok</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {yahooTicker && (
                      <button
                        onClick={() => setExpandedChartId(isChartOpen ? null : h.id)}
                        className="text-sm font-medium text-zinc-500"
                      >
                        {isChartOpen ? "Grafigi gizle" : "Grafik"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-sm font-medium text-red-500"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {isChartOpen && yahooTicker && (
                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <p className="mb-2 text-xs text-zinc-400">Son 1 yil fiyat trendi</p>
                    <PriceChart symbol={yahooTicker} currencyLabel={getChartCurrencyLabel(h.asset_type)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
