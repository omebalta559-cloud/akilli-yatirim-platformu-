"use client";

import { useI18n } from "@/lib/i18n";

// TR/EN arasinda gecis yapan kucuk dugme. Uzerinde, gecilecek dilin kisa
// kodunu gosterir (TR modunda "EN", EN modunda "TR").
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "tr" ? "en" : "tr")}
      title={t("lang.switchTitle")}
      aria-label={t("lang.switchTitle")}
      className={`rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
    >
      {t("lang.switchLabel")}
    </button>
  );
}
