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
  film: { src: "/media/meekitaz-film.mp4", poster: "/media/meekitaz-film-poster.jpg", headline: "How we do diamonds", copy: "Every TG Jewellers stone is IGI or GIA certified, grown above ground and set by hand in our workshop. Same fire. Lighter footprint." },
};

const brands: Record<string, Brand> = { meekitaz, tg };
export const brand: Brand = brands[process.env.NEXT_PUBLIC_BRAND || "meekitaz"] || meekitaz;

/** Inline CSS that overrides the :root tokens from globals.css for this brand. */
export const brandCss = Object.entries(brand.colors).map(([k, v]) => `--${k}:${v}`).join(";");
