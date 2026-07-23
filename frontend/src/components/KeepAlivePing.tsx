"use client";

import { useEffect } from "react";
import { getApiUrl } from "@/lib/api";

const PING_INTERVAL_MS = 5 * 60 * 1000;

// Render'in ucretsiz backend'i ~15 dakika istek gelmeyince uykuya geciyor.
// Sayfa acikken periyodik olarak backend'e sessiz bir istek atarak bunu
// engelliyoruz.
export default function KeepAlivePing() {
  useEffect(() => {
    const apiUrl = getApiUrl();

    function ping() {
      fetch(`${apiUrl}/`, { cache: "no-store" }).catch(() => {
        /* baglanti gecici olarak basarisiz olabilir, bir sonraki denemede duzelir */
      });
    }

    ping();
    const intervalId = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return null;
}
