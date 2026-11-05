import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE, isPublicHost } from "@/lib/seo";

// Only the real domain is crawlable: *.vercel.app copies and previews stay out of Google.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") || "";
  if (!isPublicHost(host)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/search", "/build", "/bag", "/daily", "/dream/", "/floating", "/looks", "/reel"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
