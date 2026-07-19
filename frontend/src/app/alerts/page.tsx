"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { CUSTOM_SYMBOL, SYMBOLS_BY_TYPE, getSymbolLabel } from "@/lib/marketSymbols";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

type Alert = {
  id: number;
  asset_symbol: string;
  asset_type: string;
  target_price: number;
  direction: "ustunde" | "altinda";
  is_triggered: boolean;
  created_at: string;
  triggered_at: string | null;
};

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [assetType, setAssetType] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"ustunde" | "altinda">("ustunde");
  const [submitting, setSubmitting] = useState(false);

  async function loadAlerts(token: string) {
    const res = await fetch(`${API_URL}/alerts/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Alarmlar yüklenemedi.");
    setAlerts(await res.json());
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadAlerts(token).catch(() => setError("Alarmlar yüklenirken bir hata oluştu."));

    const intervalId = setInterval(() => {
      loadAlerts(token).catch(() => {});
    }, 30000);
    return () => clearInterval(intervalId);
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const finalSymbol = assetSymbol === CUSTOM_SYMBOL ? customSymbol : assetSymbol;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/alerts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_symbol: finalSymbol,
          asset_type: assetType,
          target_price: Number(targetPrice),
          direction,
        }),
      });
      if (!res.ok) throw new Error("Alarm eklenemedi.");
      setAssetType("");
      setAssetSymbol("");
      setCustomSymbol("");
      setTargetPrice("");
      setDirection("ustunde");
      await loadAlerts(token);
    } catch {
      setError("Alarm eklenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/alerts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Silinemedi.");
      await loadAlerts(token);
    } catch {
      setError("Alarm silinirken bir hata oluştu.");
    }
  }

  const activeAlerts = alerts?.filter((a) => !a.is_triggered) ?? [];
  const triggeredAlerts = alerts?.filter((a) => a.is_triggered) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Fiyat Alarmlarım
          </h1>
          <Link href="/portfolio" className="text-sm font-medium text-zinc-500">
            Portföyüme dön
          </Link>
        </div>

        <p className="-mt-4 text-xs text-zinc-400">
          Alarmlar 60 saniyede bir sunucu tarafında kontrol edilir, bu sayfa da 30 saniyede bir
          yenilenir.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {triggeredAlerts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-emerald-600">Tetiklenen Alarmlar</p>
            {triggeredAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-950"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {getSymbolLabel(a.asset_type, a.asset_symbol)}
                  </span>{" "}
                  <span className="text-zinc-600 dark:text-zinc-300">
                    hedef fiyat {a.target_price} ({a.direction === "ustunde" ? "üstüne çıktı" : "altına düştü"})
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-sm font-medium text-red-500"
                >
                  Kaldır
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold text-zinc-500">Yeni Alarm Ekle</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Tür (varlık kategorisi)
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
                  Kategori seç
                </option>
                <option value="kripto">Kripto</option>
                <option value="doviz">Döviz</option>
                <option value="altin">Altın / Gümüş</option>
                <option value="hisse">Hisse Senedi</option>
                <option value="gayrimenkul">Gayrimenkul</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Sembol (varlığın kodu)
              <select
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value)}
                required
                disabled={!assetType}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="" disabled>
                  {assetType ? "Sembol seç" : "Önce tür seç"}
                </option>
                {(SYMBOLS_BY_TYPE[assetType] ?? []).map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {getSymbolLabel(assetType, symbol)}
                  </option>
                ))}
                <option value={CUSTOM_SYMBOL}>Diğer (elle yaz)</option>
              </select>
              {assetSymbol === CUSTOM_SYMBOL && (
                <input
                  placeholder="Özel sembol yaz"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  required
                  className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Hedef Fiyat
              <input
                type="number"
                step="any"
                placeholder="65000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Yön
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "ustunde" | "altinda")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="ustunde">Bu fiyatın üstüne çıkınca</option>
                <option value="altinda">Bu fiyatın altına düşünce</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {submitting ? "Ekleniyor..." : "Alarm Ekle"}
          </button>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-500">Aktif Alarmlar</p>
          {alerts === null && <p className="text-sm text-zinc-400">Yükleniyor...</p>}
          {alerts !== null && activeAlerts.length === 0 && (
            <p className="text-sm text-zinc-400">Henüz aktif bir alarmın yok.</p>
          )}
          {activeAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {getSymbolLabel(a.asset_type, a.asset_symbol)}
                </span>{" "}
                <span className="text-zinc-500">
                  {a.direction === "ustunde" ? "üstüne çıkınca" : "altına düşünce"} haber ver:{" "}
                  {a.target_price}
                </span>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-sm font-medium text-red-500"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
