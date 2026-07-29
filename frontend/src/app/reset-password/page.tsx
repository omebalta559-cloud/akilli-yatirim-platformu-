"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Lock } from "lucide-react";
import { saveToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? "Şifre sıfırlanamadı.");
      }
      // Basarili: otomatik giris yapip ana sayfaya yonlendir.
      saveToken(data.access_token);
      router.push("/");
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
          <p className="text-sm text-zinc-500">Yeni şifreni belirle</p>
        </div>

        {!token ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-red-600 dark:text-red-400">
              Geçersiz veya eksik sıfırlama bağlantısı. Lütfen e-postandaki bağlantıyı tekrar kullan.
            </p>
            <Link
              href="/forgot-password"
              className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Yeni bağlantı iste
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Yeni şifre (en az 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Yeni şifre (tekrar)"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Şifreyi değiştir ve giriş yap"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
          <p className="text-sm text-zinc-400">Yükleniyor...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
