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
import { PlanOrb } from "@/components/PlanKit";
import DreamList from "@/components/DreamList";
import MiaChat from "@/components/MiaChat";
import PressFx from "@/components/PressFx";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import RingPassage from "@/components/RingPassage";
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
          <PlanOrb />
        <RingPassage mPath={"M61 132 L63 163 L69 183 L82 209 L98 231 L119 253 L149 280 L192 314 L222 335 L120 202 L95 158 L88 138 L87 124 L90 114 L101 104 L112 101 L133 102 L162 108 L185 116 L216 131 L235 143 L262 165 L302 209 L319 232 L346 275 L393 368 L407 384 L414 389 L427 394 L436 394 L448 390 L458 383 L468 372 L476 360 L519 274 L552 223 L576 193 L605 163 L640 136 L667 121 L691 111 L715 104 L740 100 L757 101 L768 105 L776 113 L779 122 L779 133 L772 155 L752 192 L719 238 L642 336 L704 290 L740 259 L762 237 L788 202 L797 184 L802 169 L805 152 L805 126 L799 101 L787 76 L772 55 L748 32 L716 13 L689 4 L660 0 L626 2 L609 6 L588 14 L563 29 L535 55 L514 84 L460 195 L447 218 L434 236 L415 208 L356 87 L340 62 L315 35 L302 25 L283 14 L259 5 L232 0 L203 0 L169 7 L135 22 L114 37 L96 55 L85 69 L68 101 Z M89 241 L89 277 L86 291 L77 315 L59 345 L18 403 L5 432 L1 450 L0 467 L2 482 L9 501 L29 529 L54 552 L87 574 L130 595 L181 612 L227 622 L269 626 L285 620 L301 603 L313 582 L318 569 L324 539 L324 507 L318 475 L308 449 L284 413 L246 373 L222 352 L167 313 L131 284 Z M776 241 L734 284 L718 298 L644 353 L607 385 L581 413 L564 437 L555 454 L548 472 L542 502 L542 537 L545 555 L553 579 L565 600 L578 615 L591 623 L598 625 L615 625 L653 619 L711 602 L748 587 L788 566 L821 543 L846 518 L859 496 L865 472 L865 456 L862 439 L853 415 L845 400 L801 337 L786 310 L779 290 L776 275 Z"} />
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
