import Link from "next/link";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M17 7h4v4" />
            </svg>
          </span>
          Akıllı Portföy
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/blog"
            className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Blog
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BlogCTA() {
  return (
    <div className="my-10 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 px-8 py-9 text-center text-white">
      <h3 className="text-xl font-extrabold sm:text-2xl">Kendi reel getirini otomatik gör</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-indigo-200">
        Yatırımlarını ekle; enflasyona göre gerçek kâr/zararını Akıllı Portföy anında hesaplasın.
        Yapay zekâ asistanı da cabası.
      </p>
      <Link
        href="/register"
        className="mt-5 inline-block rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-900 transition-colors hover:bg-indigo-50"
      >
        Ücretsiz Başla →
      </Link>
      <p className="mt-3 text-xs text-indigo-300">Kredi kartı gerekmez · Türkiye piyasalarına özel</p>
    </div>
  );
}

export function BlogFooter() {
  return (
    <footer className="mx-auto max-w-3xl px-5 pb-14 pt-6">
      <p className="border-t border-zinc-200 pt-6 text-xs text-zinc-400 dark:border-zinc-800">
        © {new Date().getFullYear()} Akıllı Portföy · Yapay zekâ destekli portföy takip platformu.
        Bu içerik yatırım tavsiyesi değildir, genel bilgilendirme amaçlıdır.
      </p>
    </footer>
  );
}
