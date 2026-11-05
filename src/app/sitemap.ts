import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { SITE, primaryHandles } from "@/lib/seo";

// Home, the category pages, the information pages and one page per design (the metal versions point at it with a canonical).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const info = ["faq", "warranty", "shipping-policy", "return-policy", "privacy-policy", "terms-and-conditions"];
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...categories.map(c => ({ url: `${SITE}/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...info.map(s => ({ url: `${SITE}/${s}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...primaryHandles.map(h => ({ url: `${SITE}/products/${h}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
