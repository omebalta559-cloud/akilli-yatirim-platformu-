"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Holding = {
  asset_symbol: string;
  asset_type: string;
  quantity: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AdvisorPage() {
  const router = useRouter();
  const [portfolioSummary, setPortfolioSummary] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/portfolio/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((holdings: Holding[]) => {
        const summary = holdings
          .map((h) => `${h.asset_symbol} (${h.asset_type}): ${h.quantity} adet`)
          .join(", ");
        setPortfolioSummary(summary);
      })
      .catch(() => {
        /* portfoy ozeti alinamazsa danisman genel bilgiyle devam eder */
      });
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !question.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
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
    <div className="flex min-h-screen flex-col bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">AI Danisman</h1>
          <Link href="/" className="text-sm font-medium text-zinc-500">
            Dashboard&apos;a don
          </Link>
        </div>

        <p className="text-xs text-zinc-400">
          Bu bir yatirim tavsiyesi degildir, genel bilgi amaclidir.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {messages.length === 0 && (
            <p className="text-sm text-zinc-400">
              Portfoyun veya guncel piyasa hakkinda bir soru sorarak baslayabilirsin.
            </p>
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
      </main>
    </div>
  );
}
