"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Mail, ArrowLeft } from "lucide-react";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Bir hata oluştu.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600" strokeWidth={2.5} />
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Akıllı Portföy</span>
          </div>
          <p className="text-sm text-zinc-500">Şifreni sıfırla</p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">E-postanı kontrol et</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Eğer <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span> kayıtlıysa,
                şifre sıfırlama bağlantısını gönderdik. Bağlantı 15 dakika geçerli.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Girişe dön
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm text-zinc-500">
              Hesabının e-posta adresini gir; sana şifre sıfırlama bağlantısı gönderelim.
            </p>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Girişe dön
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
