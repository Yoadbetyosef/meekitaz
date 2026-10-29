import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() { return [{ source: "/collections/one-of-one", destination: "/one-of-one", permanent: true }]; },
  async headers() {
    // our own files (video, poster, logo shapes): the browser may keep them for a day and refresh in the background
    const c = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [{ source: "/media/:path*", headers: c }, { source: "/press/:path*", headers: c }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
      { protocol: "https", hostname: "d2ol7oe51mr4n9.cloudfront.net" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 78],
    deviceSizes: [390, 430, 640, 768, 1024, 1280, 1536, 1920, 2560],
  },
};

export default nextConfig;
