import type { Metadata } from "next";
import { faqCategories, allFaqItems } from "@/content/faq";
import { BlogHeader, BlogCTA, BlogFooter } from "@/components/blog";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular — Finans & Yatırım",
  description:
    "Enflasyon, reel getiri, borsa, altın, kripto, portföy ve vergi hakkında en çok sorulan finans sorularının sade cevapları.",
  alternates: { canonical: "/sss" },
};

// Google'in "Sikca Sorulan Sorular" zengin sonucu icin FAQPage yapilandirilmis
// verisi (JSON-LD). Tum soru-cevaplari icerir.
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Rehber</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Sıkça Sorulan Sorular
        </h1>
        <p className="mt-3 text-zinc-500">
          Enflasyon, reel getiri, borsa, altın, kripto, portföy ve vergi hakkında en çok merak edilen
          soruların sade, tarafsız cevapları. (Yatırım tavsiyesi değildir.)
        </p>

        <div className="mt-8 flex flex-col gap-10">
          {faqCategories.map((cat) => (
            <section key={cat.title}>
              <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">{cat.title}</h2>
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-zinc-200 bg-white p-4 open:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-950 dark:open:border-indigo-900"
                  >
                    <summary className="cursor-pointer list-none font-medium text-zinc-900 marker:content-none dark:text-zinc-50">
                      <span className="flex items-center justify-between gap-3">
                        {item.q}
                        <span className="text-indigo-500 transition-transform group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <BlogCTA />
      </main>
      <BlogFooter />
    </div>
  );
}
