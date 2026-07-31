import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/content/blog";
import { BlogHeader, BlogCTA, BlogFooter } from "@/components/blog";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Blog · Rehber</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[2.5rem]">
          {article.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-b border-zinc-200 pb-5 text-sm text-zinc-400 dark:border-zinc-800">
          <span>Akıllı Portföy</span>
          <span>{article.readingTime}</span>
          <span>{formatDate(article.date)}</span>
        </div>

        <div className="blog-prose mt-7" dangerouslySetInnerHTML={{ __html: article.html }} />

        <BlogCTA />
      </main>
      <BlogFooter />
    </div>
  );
}
