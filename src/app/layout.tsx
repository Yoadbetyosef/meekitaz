import type { Metadata, Viewport } from "next";
import { Marcellus, Marcellus_SC, Cormorant_Garamond, Mrs_Saint_Delafield } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { SITE } from "@/lib/seo";
import DesignLabGate from "@/components/DesignLabGate";
import BgPalette from "@/components/BgPalette";
import BarStudio from "@/components/BarStudio";
import FontPalette from "@/components/FontPalette";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import FreeStuds from "@/components/FreeStuds";
import ShareSheet from "@/components/ShareSheet";
import DailyMode from "@/components/DailyMode";
import { DailyBar } from "@/components/DailyPrice";
import DreamList from "@/components/DreamList";
import MiaChat from "@/components/MiaChat";
import PressFx from "@/components/PressFx";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import HeroWarm from "@/components/HeroWarm";
import { categories } from "@/lib/data";

const prata = Marcellus({ weight: "400", subsets: ["latin"], variable: "--f-display", display: "swap" }); // headings — Marcellus (2026-11-03, "White Lotus" set)
const cormorant = Cormorant_Garamond({ weight: ["500"], style: ["italic"], subsets: ["latin"], variable: "--f-sub", display: "swap" });
const didact = Cormorant_Garamond({ weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"], variable: "--f-title", display: "swap" }); // jewelry (product) titles and regular text — Cormorant Garamond
const script = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], variable: "--f-script", display: "swap" }); // handwritten Meekitaz signature (home film card)
const archivo = Marcellus_SC({ weight: "400", subsets: ["latin"], variable: "--f-body", display: "swap" }); // small spaced labels, buttons, prices — Marcellus SC

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "MEEKITAZ — Serious diamonds, worn lightly.",
  description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
  openGraph: { siteName: "Meekitaz", type: "website", locale: "en_US", title: "MEEKITAZ — Serious diamonds, worn lightly.", description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands." },
};

// schema.org: who we are, once per page (the product pages add their own Product data)
const ORG_LD = [
  { "@context": "https://schema.org", "@type": "Organization", name: "Meekitaz", url: SITE, address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY", addressCountry: "US" } },
  { "@context": "https://schema.org", "@type": "WebSite", name: "Meekitaz", url: SITE },
];
export const viewport: Viewport = { themeColor: "#E5E3EF", viewportFit: "cover" }; // the browser bars take the home page colour (Mist)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${prata.variable} ${cormorant.variable} ${archivo.variable} ${didact.variable} ${script.variable}`}>
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} /></head>
      <body>
        <div className="edge-t" aria-hidden="true" /><div className="edge-b" aria-hidden="true" />{/* phones: the browser bars always take the home page colour, whatever scrolls under them */}
        <DailyMode>
        <CartProvider>
          <DailyBar />
          <Nav />
          <HeroWarm map={Object.fromEntries(categories.map(c => [c.slug, { d: c.desktop, m: c.mobile }]))} />
          <div className="mk-page" id="mk-page">{children}</div>
          <Footer />
          <Toast />
          <FreeStuds />
          <MiaChat />
          <ShareSheet />
          <DreamList />
          <PressFx />
          <CartDrawer />
          <DesignLabGate />
          <BgPalette />
          <BarStudio />
          <FontPalette />
        </CartProvider>
        </DailyMode>
      </body>
    </html>
  );
}
