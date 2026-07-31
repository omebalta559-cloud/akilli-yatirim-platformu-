import type { MetadataRoute } from "next";

const BASE_URL = "https://akilli-yatirim-platformu.vercel.app";

// Arama motorlarina indekslenmesini istedigimiz herkese acik sayfalarin listesi.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/charts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
