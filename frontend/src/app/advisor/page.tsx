"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import RiskProfileAdvisor from "@/components/RiskProfileAdvisor";
import { CRYPTO_IDS, GOLD_NAMES } from "@/lib/marketSymbols";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

type Holding = {
  id: number;
  asset_symbol: string;
  asset_type: string;
  quantity: number;
  purchase_price: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CategoryTotals = { kripto: number; bist: number; safe: number; total: number };

function buildWelcomeMessage(totals: CategoryTotals, riskProfile: string): string {
  if (totals.total <= 0) {
    return "Merhaba! Henuz portfoyune hic varlik eklememissin. Profiline gore harika bir baslangic portfoyu hazirlayabiliriz. Nasil bir yatirim planliyorsun?";
  }

  const cryptoPercent = (totals.kripto / totals.total) * 100;
  const safePercent = (totals.safe / totals.total) * 100;

  if (cryptoPercent > 50 && (riskProfile === "Dusuk" || riskProfile === "Orta")) {
    return `Merhaba! Portfoyunu inceledim. Su an varliklarinin %${cryptoPercent.toFixed(0)}'si Kripto parada gorunuyor. Bu senin sectigin '${riskProfile}' risk profiline gore biraz fazla riskli. Dengelemek icin belki BIST hisselerini veya Altini biraz artirmak isteyebilirsin. Bana portfoyunle ilgili ne sormak istersin?`;
  }

  if (safePercent > 60 && riskProfile === "Yuksek") {
    return `Merhaba! Portfoyunun %${safePercent.toFixed(0)}'si guvenli limanlarda (Altin/Doviz) duruyor. Yuksek risk/yuksek getiri hedefleyen profilin icin belki bir miktar Kripto veya BIST hissesi eklemeyi dusunebilirsin. Portfoyunu nasil optimize edebilecegimizi konusalim mi?`;
  }

  return `Merhaba! Portfoyunu inceledim, mevcut dagilimin '${riskProfile}' risk profiline uygun gorunuyor. Portfoyunle ilgili ne sormak istersin?`;
}

export default function AdvisorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profil" | "sohbet">("profil");
  const [portfolioSummary, setPortfolioSummary] = useState("");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<number, number>>({});
  const [riskProfile, setRiskProfile] = useState("Orta");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("riskProfile");
    if (stored) setRiskProfile(stored);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/portfolio/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Holding[]) => {
        setHoldings(data);
        const summary = data
          .map((h) => `${h.asset_symbol} (${h.asset_type}): ${h.quantity} adet`)
          .join(", ");
        setPortfolioSummary(summary);
      })
      .catch(() => {
        /* portfoy ozeti alinamazsa danisman genel bilgiyle devam eder */
      });

    fetch(`${API_URL}/advisor/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((history: { role: "user" | "assistant"; content: string }[]) => {
        setMessages(history.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => {
        /* gecmis alinamazsa bos sohbetle devam edilir */
      })
      .finally(() => setHistoryLoaded(true));
  }, [router]);

  useEffect(() => {
    if (holdings.length === 0) return;

    async function loadCurrentPrices() {
      const prices: Record<number, number> = {};

      const usdTryRes = await fetch(`${API_URL}/market/forex?base=USD&symbols=TRY`);
      const usdTryData = await usdTryRes.json();
      const usdToTry: number = usdTryData.rates.TRY;

      const cryptoSymbols = [
        ...new Set(holdings.filter((h) => h.asset_type === "kripto").map((h) => h.asset_symbol)),
      ];
      const cryptoIds = cryptoSymbols.map((s) => CRYPTO_IDS[s]).filter(Boolean);
      const cryptoPrices: Record<string, { usd: number }> =
        cryptoIds.length > 0
          ? await (await fetch(`${API_URL}/market/crypto?coins=${cryptoIds.join(",")}`)).json()
          : {};

      const dovizSymbols = [
        ...new Set(holdings.filter((h) => h.asset_type === "doviz").map((h) => h.asset_symbol)),
      ];
      const dovizRates: Record<string, number> = {};
      await Promise.all(
        dovizSymbols.map(async (symbol) => {
          const res = await fetch(`${API_URL}/market/forex?base=${symbol}&symbols=TRY`);
          const data = await res.json();
          dovizRates[symbol] = data.rates.TRY;
        })
      );

      const needsGold = holdings.some((h) => h.asset_type === "altin");
      const goldData = needsGold ? await (await fetch(`${API_URL}/market/gold`)).json() : null;

      const needsStocks = holdings.some((h) => h.asset_type === "hisse");
      const stockData = needsStocks ? await (await fetch(`${API_URL}/market/stocks`)).json() : null;

      for (const h of holdings) {
        if (h.asset_type === "kripto") {
          const id = CRYPTO_IDS[h.asset_symbol];
          if (id && cryptoPrices[id]) prices[h.id] = cryptoPrices[id].usd * usdToTry;
        } else if (h.asset_type === "doviz") {
          if (dovizRates[h.asset_symbol]) prices[h.id] = dovizRates[h.asset_symbol];
        } else if (h.asset_type === "altin" && goldData) {
          const goldName = GOLD_NAMES[h.asset_symbol];
          const item = goldData.result.find((g: { name: string }) => g.name === goldName);
          if (item) prices[h.id] = item.selling;
        } else if (h.asset_type === "hisse" && stockData) {
          const item = stockData.result.find((s: { name: string }) => s.name === h.asset_symbol);
          if (item) prices[h.id] = item.price;
        }
      }

      setCurrentPrices(prices);
    }

    loadCurrentPrices().catch(() => {
      /* canli fiyat alinamazsa karsilama mesaji alis fiyatlarina gore hesaplanir */
    });
  }, [holdings]);

  const categoryTotals = useMemo<CategoryTotals>(() => {
    let kripto = 0;
    let bist = 0;
    let safe = 0;
    let total = 0;

    for (const h of holdings) {
      const price = currentPrices[h.id] ?? h.purchase_price;
      const value = price * h.quantity;
      total += value;
      if (h.asset_type === "kripto") kripto += value;
      else if (h.asset_type === "hisse" || h.asset_type === "gayrimenkul") bist += value;
      else if (h.asset_type === "altin" || h.asset_type === "doviz") safe += value;
    }

    return { kripto, bist, safe, total };
  }, [holdings, currentPrices]);

  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(categoryTotals, riskProfile),
    [categoryTotals, riskProfile]
  );

  async function handleClearHistory() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/advisor/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
    } catch {
      setError("Sohbet gecmisi temizlenirken bir hata olustu.");
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !question.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) =>
      prev.length === 0
        ? [{ role: "assistant", content: welcomeMessage }, userMessage]
        : [...prev, userMessage]
    );
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/advisor/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userMessage.content,
          portfolio_summary: portfolioSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? "Danisman yanit veremedi.");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Danisman ile iletisim kurulurken bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Akilli Danisman</h1>
          <div className="flex items-center gap-4">
            {activeTab === "sohbet" && messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-sm font-medium text-zinc-500"
              >
                Sohbeti Temizle
              </button>
            )}
            <Link href="/" className="text-sm font-medium text-zinc-500">
              Dashboard&apos;a don
            </Link>
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Bu bir yatirim tavsiyesi degildir, genel bilgi amaclidir.
        </p>

        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("profil")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "profil"
                ? "border-b-2 border-[#2a78d6] text-[#2a78d6]"
                : "text-zinc-500"
            }`}
          >
            Risk Profili
          </button>
          <button
            onClick={() => setActiveTab("sohbet")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "sohbet"
                ? "border-b-2 border-[#2a78d6] text-[#2a78d6]"
                : "text-zinc-500"
            }`}
          >
            Danismanlik Oturumu
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {activeTab === "profil" && <RiskProfileAdvisor />}

        {activeTab === "sohbet" && (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              {historyLoaded && messages.length === 0 && (
                <div className="max-w-[85%] self-start rounded-xl bg-zinc-100 px-4 py-2 text-sm whitespace-pre-wrap text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
                  {welcomeMessage}
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "self-end bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="self-start rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
                  Yaziyor...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Sorunu yaz..."
                required
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Gonder
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
