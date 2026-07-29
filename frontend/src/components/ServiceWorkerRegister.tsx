"use client";

import { useEffect } from "react";

// Tarayici destekliyorse service worker'i kaydeder; PWA'nin kurulabilir
// olmasi ve temel cevrimdisi destek icin gereklidir. Hata olursa sessizce gecer.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* kayit basarisiz olursa uygulama normal calismaya devam eder */
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
