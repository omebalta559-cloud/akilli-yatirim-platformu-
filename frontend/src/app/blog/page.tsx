import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/content/blog";
import { BlogHeader, BlogFooter } from "@/components/blog";

export const metadata: Metadata = {
  title: "Blog — Yatırım & Reel Getiri Rehberleri",
  description:
    "Enflasyona göre reel getiri, portföy yönetimi ve Türkiye piyasaları üzerine sade, faydalı rehberler.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogListPage() {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Blog</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Yatırım &amp; reel getiri rehberleri
        </h1>
        <p className="mt-3 text-zinc-500">
          Enflasyona göre gerçek getiri, portföy yönetimi ve Türkiye piyasaları üzerine sade, faydalı yazılar.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {sorted.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <p className="text-xs text-zinc-400">
                {formatDate(a.date)} · {a.readingTime}
              </p>
              <h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{a.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{a.description}</p>
              <span className="mt-2 inline-block text-sm font-medium text-indigo-600">Oku →</span>
            </Link>
          ))}
        </div>
      </main>
      <BlogFooter />
    </div>
  );
}
