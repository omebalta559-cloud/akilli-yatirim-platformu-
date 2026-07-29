"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getToken } from "@/lib/auth";
import RiskProfileAdvisor from "@/components/RiskProfileAdvisor";
import { CRYPTO_IDS, GOLD_NAMES } from "@/lib/marketSymbols";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

// Asistan cevaplarindaki basit markdown'i (kalin **...** ve * / - listeleri)
// ekstra bir kutuphaneye ihtiyac duymadan React'e cevirir. AI'nin dondurdugu
// ham "**" ve "*" isaretlerinin metinde gorunmesini engeller.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-zinc-900 dark:text-zinc-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function renderMessage(content: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="ml-1 flex list-inside list-disc flex-col gap-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  content.split("\n").forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      listItems.push(<li key={`li-${i}`}>{renderInline(trimmed.slice(2), `li-${i}`)}</li>);
    } else {
      flushList();
      if (trimmed) blocks.push(<p key={`p-${i}`}>{renderInline(line, `p-${i}`)}</p>);
    }
  });
  flushList();
  return blocks;
}

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-[90%] items-start gap-2.5 self-start">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {children}
      </div>
    </div>
  );
}

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
    return "Merhaba! Henüz portföyüne hiç varlık eklemedin. Risk profiline göre sana uygun bir başlangıç portföyü oluşturabiliriz. Nasıl bir yatırım yapmayı planlıyorsun?";
  }

  const cryptoPercent = (totals.kripto / totals.total) * 100;
  const safePercent = (totals.safe / totals.total) * 100;

  if (cryptoPercent > 50 && (riskProfile === "Dusuk" || riskProfile === "Orta")) {
    return `Merhaba! Portföyünü inceledim. Şu an varlıklarının %${cryptoPercent.toFixed(0)}'si kripto para biriminde görünüyor. Bu, seçtiğin '${riskProfile}' risk profiline göre biraz fazla riskli. Dengelemek için belki BIST hisselerini veya altını biraz artırmak isteyebilirsin. Portföyünle ilgili bana ne sormak istersin?`;
  }

  if (safePercent > 60 && riskProfile === "Yuksek") {
    return `Merhaba! Portföyünün %${safePercent.toFixed(0)}'si güvenli limanlarda (altın/döviz) duruyor. Yüksek risk/yüksek getiri hedefleyen profilin için belki bir miktar kripto veya BIST hissesi eklemeyi düşünebilirsin. Portföyünü nasıl optimize edebileceğimizi konuşalım mı?`;
  }

  return `Merhaba! Portföyünü inceledim, mevcut dağılımın '${riskProfile}' risk profiline uygun görünüyor. Portföyünle ilgili ne sormak istersin?`;
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
  // historyCount: acilista backend'den yuklenen "eski" mesaj sayisi. Bu
  // mesajlar varsayilan olarak gizlenir; showHistory ile acilir. Yeni oturumda
  // gonderilen mesajlar (index >= historyCount) her zaman gorunur.
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
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
        const loaded = history.map((m) => ({ role: m.role, content: m.content }));
        setMessages(loaded);
        setHistoryCount(loaded.length);
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
      setHistoryCount(0);
      setShowHistory(false);
    } catch {
      setError("Sohbet geçmişi temizlenirken bir hata oluştu.");
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
        throw new Error(data.detail ?? "Asistan yanıt veremedi.");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Asistan ile iletişim kurulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col bg-zinc-50 px-6 py-10 dark:bg-black ${
        // Sohbette: sabit viewport yuksekligi -> mesajlar ic kismda kayar,
        // giris kutusu her zaman altta sabit kalir (uzun sohbette asagi
        // inmeye gerek yok). Profil sekmesinde form uzun oldugu icin normal akis.
        activeTab === "sohbet" ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      <main
        className={`mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 ${
          activeTab === "sohbet" ? "overflow-hidden" : ""
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Yatırım Asistanı</h1>
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
              Dashboard&apos;a dön
            </Link>
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Bu bir yatırım tavsiyesi değildir, genel bilgi amaçlıdır.
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
            Asistan Sohbeti
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {activeTab === "profil" && <RiskProfileAdvisor />}

        {activeTab === "sohbet" && (
          <>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-gradient-to-b from-indigo-50/40 to-white p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
              {historyCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="mx-auto rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm transition-colors hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-indigo-400"
                >
                  {showHistory ? "Geçmişi gizle" : `Geçmiş sohbeti göster (${historyCount} mesaj)`}
                </button>
              )}
              {historyLoaded && messages.length === historyCount && !showHistory && (
                <AssistantBubble>
                  <p className="whitespace-pre-wrap">{welcomeMessage}</p>
                </AssistantBubble>
              )}
              {messages.map((m, i) => {
                // Eski (gecmis) mesajlar yalnizca "Geçmişi göster" acikken gorunur.
                if (i < historyCount && !showHistory) return null;
                return m.role === "user" ? (
                  <div
                    key={i}
                    className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm"
                  >
                    {m.content}
                  </div>
                ) : (
                  <AssistantBubble key={i}>
                    <div className="flex flex-col gap-2 leading-relaxed">{renderMessage(m.content)}</div>
                  </AssistantBubble>
                );
              })}
              {loading && (
                <AssistantBubble>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                  </span>
                </AssistantBubble>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Sorunu yaz..."
                required
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
