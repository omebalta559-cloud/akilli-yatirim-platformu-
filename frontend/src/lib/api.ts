const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Uretimde (Vercel vb.) backend baska bir adreste/domainde calisir, bu yuzden
// NEXT_PUBLIC_API_URL acikca ayarlanmissa her zaman onu kullaniyoruz.
//
// Yerel gelistirmede ise bu degisken bilerek BOS birakilir (bkz. docker-compose.yml):
// backend adresini sabit bir IP yerine, tarayicinin o an eristigi hostname'den
// turetiyoruz (ornegin localhost:3000 -> localhost:8000, 10.1.2.3:3000 -> 10.1.2.3:8000).
// Boylece bilgisayarin LAN IP'si degistiginde (Wi-Fi yeniden baglanma, DHCP
// yenileme vb.) kod degistirmeye gerek kalmiyor; hem localhost'tan hem de
// telefon gibi ag uzerindeki cihazlardan erisim ayni sekilde calisir.
export function getApiUrl(): string {
  if (CONFIGURED_API_URL) {
    return CONFIGURED_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}
