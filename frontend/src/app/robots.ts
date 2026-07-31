import type { MetadataRoute } from "next";

const BASE_URL = "https://akilli-yatirim-platformu.vercel.app";

// Google/arama motorlarina tarama kurallarini bildirir. Herkese acik sayfalar
// taranabilir; sadece giris gerektiren (SEO degeri olmayan) sayfalar kapatilir.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portfolio", "/alerts", "/advisor", "/reset-password", "/forgot-password"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
