"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Mail, Lock, Check } from "lucide-react";
import { saveToken } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? "Kayıt başarısız oldu.");
      }
      saveToken(data.access_token);
      // Yeni kullaniciyi dogrudan portfoye yonlendir: uygulamanin asil degeri
      // (enflasyona gore reel getiri) ancak portfoy girilince gorunur.
      router.push("/portfolio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* SOL PANEL */}
      <div className="relative hidden overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* yumusak isik efektleri */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 620 L80 560 L160 600 L240 460 L320 500 L400 320 L480 380 L560 180 L600 220"
            stroke="#818cf8"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M0 700 L90 660 L180 690 L260 580 L340 610 L420 470 L500 520 L600 380"
            stroke="#6366f1"
            strokeWidth="2"
            opacity="0.6"
            fill="none"
          />
          <circle cx="600" cy="220" r="5" fill="#818cf8" />
          <circle cx="480" cy="380" r="3" fill="#818cf8" />
          <circle cx="320" cy="500" r="3" fill="#818cf8" />
        </svg>

        <div className="relative flex items-center gap-2 text-white">
          <TrendingUp className="h-7 w-7 text-indigo-400" strokeWidth={2.5} />
          <span className="text-lg font-semibold">Akıllı Portföy</span>
        </div>

        <div className="relative flex flex-col gap-8">
          <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
            Yatırımlarını{" "}
            <span className="text-emerald-400">akıllıca</span> yönetmeye bugün başla.
          </h1>

          <ul className="flex flex-col gap-4">
            {[
              "Borsa, kripto, altın, döviz — hepsi tek panelde",
              "Yapay zekâ yatırım asistanı",
              "Enflasyona göre gerçek (reel) getiri",
              "Fiyat alarmları ve kişisel risk analizi",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-indigo-100">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-300/50">
          &copy; {new Date().getFullYear()} Akıllı Portföy. Tüm hakları saklıdır.
        </p>
      </div>

      {/* SAG PANEL */}
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 dark:bg-white">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600" strokeWidth={2.5} />
              <span className="text-lg font-semibold text-slate-900">Akıllı Portföy</span>
            </div>
            <p className="text-sm text-slate-500">Ücretsiz hesabını oluştur</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Şifre (en az 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Giriş yap
              </Link>
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">veya</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1 transition-all hover:bg-gray-100">
              <GoogleSignInButton onError={setError} />
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-400">
              Bu platform yatırım tavsiyesi değildir, yalnızca genel bilgilendirme amaçlıdır.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
