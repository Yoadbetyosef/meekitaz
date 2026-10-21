/** Multi-brand config. The brand is chosen at build time with NEXT_PUBLIC_BRAND (meekitaz | tg).
 *  Everything that differs between the sites — name, logo, colours, fonts, film — lives here; the rest of the code is shared. */
export type Brand = {
  key: string;
  name: string;            // "MEEKITAZ"
  wordmark: string;        // text wordmark used when there is no logo image
  logo?: { src: string; width: number; height: number; alt: string; color?: string }; // optional image wordmark (nav + footer); with color, the image is used as a mask and painted in that colour
  title: string;           // <title>
  description: string;
  email: string;
  domain: string;
  themeColor: string;
  fonts: "meekitaz" | "tg";
  colors: Record<string, string>; // CSS custom properties (without the leading --)
  film: { src: string; poster: string; headline: string; copy: string };
  /** Per-slide overrides for the home hero (same order as lib/data slides). Omit to keep the shared images. */
  heroSlides?: Partial<{ desktop: string; mobile: string; pos: string; posM: string; zoomM: number; small: string; big: string }>[];
  /** Image per hamburger-menu tile, keyed by href (/engagement-rings, /diamonds, …). Omit to keep the shared images. */
  menuTiles?: Record<string, { img: string; pos?: string; posM?: string }>;
  /** Image per "Shop by category" tile on the home page, keyed by href. Omit to keep the shared images. */
  categoryTiles?: Record<string, { img: string }>;
  /** Images of the NEW block layers (yellow / pink / green) and the footer "hush" card. Omit to keep the shared images. */
  newCard?: { fancy?: string; pink?: string; green?: string };
  hushImg?: string;
};

const meekitaz: Brand = {
  key: "meekitaz",
  name: "MEEKITAZ",
  wordmark: "MEEKITAZ",
  title: "MEEKITAZ — Serious diamonds, worn lightly.",
  description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
  email: "hello@meekitaz.com",
  domain: "meekitaz.com",
  themeColor: "#C4DEEE",
  fonts: "meekitaz",
  colors: {},
  film: { src: "/media/meekitaz-film.mp4", poster: "/media/meekitaz-film-poster.jpg", headline: "How we do diamonds", copy: "Every Meekitaz stone is IGI or GIA certified, grown above ground and set in our Fifth Avenue atelier. Same fire. Lighter footprint." },
};

const tg: Brand = {
  key: "tg",
  name: "TG Jewellers",
  wordmark: "TG JEWELLERS",
  logo: { src: "/brands/tg/logo.png", width: 2089, height: 230, alt: "TG Jewellers", color: "#E9E4F5" },
  title: "TG Jewellers — Custom rings & fine jewellery.",
  description: "Custom rings and fine jewellery with lab-grown diamonds. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
  email: "hello@tgjewellers.com",
  domain: "tgjewellers.com",
  themeColor: "#9B7BE0",
  fonts: "tg",
  // Amethyst: purple page, lavender logo on a glass nav, lilac-mist CTAs with ink text (chosen 2026-10-21)
  colors: {
    "blue-light": "#9B7BE0",  // page background (Amethyst)
    "blue": "#E6D9FF",        // light accent (desktop hero button, dots, checks)
    "pink": "#F7D3DA",        // blush
    "rose": "#7B5BC4",        // menu overlay
    "sage": "#DCE9D9",
    "red": "#F3EFF9",         // every CTA (Lilac mist)
    "ivory": "#2B2733",       // CTA text (ink on lilac)
    "ink": "#2B2733",         // body text
    "gold": "#E9E4F5",
  },
  // Hero: natural-colour lifestyle set in the Meekitaz style (studs slide kept lilac) — 2026-10-21 (desktop 16:9 / mobile 3:4)
  heroSlides: [
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153756_96e7714b-5de1-4c62-b4ae-0f9e3b08a9c6.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153756_12e9df29-f3b8-4f69-95d4-b17a233c22e9.png", pos: "50% 40%", posM: "50% 30%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154018_b03ef699-4829-4217-bff4-332735682612.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154018_effb8adb-3f95-43ca-a1b7-38da7d4ab07a.png", pos: "50% 50%", posM: "50% 50%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153242_17e2e977-1d6f-41b7-bea7-22b97cbe6c9a.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153239_c6ee0f36-f298-427e-b1b5-d43c368a3de5.png", pos: "50% 40%", posM: "50% 40%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153734_d0ab09f9-2ce6-47e9-bfc9-c3f5fa6d24ae.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153735_6f065dcf-113e-457d-8069-33948f4e7e2f.png", pos: "50% 50%", posM: "50% 50%", zoomM: 1 },
  ],
  // Hamburger menu tiles — natural editorial set, 2026-10-21
  menuTiles: {
    "/engagement-rings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_f37ca43a-0469-454b-88e8-b4b9b1d7a9a0.png" },
    "/diamonds": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154432_22a49aac-88bd-4e16-aaed-3aa810297ea0.png" },
    "/earrings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154430_6b07bcf4-c4b0-42bd-a6e6-2d28d59157fa.png" },
    "/necklaces": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154432_8b206341-d43d-4585-856b-313018d2461c.png" },
    "/bracelets": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_cbceb330-b0d6-4e68-94dc-ed071a1e696d.png" },
    "/bands": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_58183e72-566b-487c-a138-6bf3d3c7b276.png" },
  },
  // Shop by category — black & white studio set, 2026-10-21
  categoryTiles: {
    "/engagement-rings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154804_b3e86786-0e3a-4d70-b96b-cbf20f8dc575.png" },
    "/diamonds": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154803_5fd76d05-22b1-444a-b3e8-deac63b751a4.png" },
    "/earrings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154802_9c5d7e3d-da5f-4e88-a1b2-a315d3e7db75.png" },
    "/necklaces": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154804_3138d189-e2c3-4b28-b05c-6b73a7f8865b.png" },
    "/bracelets": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154805_cfbfaebb-7bb7-4d13-a5a3-08ce555ad115.png" },
    "/bands": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154803_b84a6343-8d4a-40c7-b39a-f5f64c03c316.png" },
  },
  // NEW block layers + footer hush card, 2026-10-21
  newCard: { fancy: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_155309_58f13e5a-5ca7-4919-bb35-bb0042ca2f3f.png", pink: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_155310_917dfe5d-2b3a-48ee-b69b-702698b5eccd.png", green: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_155309_c44f285b-5534-4e05-8cc7-09a4ca77a9ed.png" },
  hushImg: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154916_7791fcbf-a9cd-41de-bf8c-2ef949b7ff95.png",
  film: { src: "/media/meekitaz-film.mp4", poster: "/media/meekitaz-film-poster.jpg", headline: "How we do diamonds", copy: "Every TG Jewellers stone is IGI or GIA certified, grown above ground and set by hand in our workshop. Same fire. Lighter footprint." },
};

const brands: Record<string, Brand> = { meekitaz, tg };
export const brand: Brand = brands[process.env.NEXT_PUBLIC_BRAND || "meekitaz"] || meekitaz;

/** Inline CSS that overrides the :root tokens from globals.css for this brand. */
export const brandCss = Object.entries(brand.colors).map(([k, v]) => `--${k}:${v}`).join(";");
