// Basit service worker: PWA kurulabilirlik kriterini karsilar ve calisma
// zamaninda getirilen GET isteklerini onbellege alarak temel cevrimdisi
// destek saglar. Karmasik bir strateji yok; amac "uygulama gibi" davranis.
const CACHE = "akilli-portfoy-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Sadece GET; API/POST isteklerine dokunma.
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Basarili yaniti kopyalayip onbellege koy (arka planda).
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request))
  );
});
