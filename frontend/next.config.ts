import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telefon gibi LAN uzerindeki cihazlardan (localhost disinda) dev sunucusuna
  // erisim icin: Next.js varsayilan olarak dev-only kaynaklara (HMR websocket,
  // JS chunk'lari vb.) izin verilmeyen origin'lerden erisimi engelliyor.
  // Joker karakterle yaygin ozel (LAN) IP araliklarinin tamamini kapsiyoruz,
  // boylece bilgisayarin IP'si degistiginde (Wi-Fi yeniden baglanma, DHCP
  // yenileme vb.) bu listeyi tekrar guncellemeye gerek kalmiyor.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.16.*.*", "172.31.*.*"],
};

export default nextConfig;
