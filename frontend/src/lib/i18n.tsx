"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, type Lang } from "./translations";

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

// Varsayilan dil Turkce. Kullanici EN'e gecerse tercihi localStorage'da
// saklanir; Turkce hicbir zaman kaldirilmaz, sadece istege bagli bir secenek.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "tr" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* localStorage kapaliysa dil yine de o oturum icin degisir */
    }
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations.tr[key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
  );
}

// Ceviri ve dil durumuna erisim. LanguageProvider disinda cagrilirsa,
// Turkce metinlerle guvenli bir yedek doner (uygulama patlamaz).
export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "tr",
      setLang: () => {},
      t: (key: string) => translations.tr[key] ?? key,
    };
  }
  return ctx;
}
