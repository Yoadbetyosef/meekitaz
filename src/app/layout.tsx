import type { Metadata, Viewport } from "next";
import { Prata, Cormorant_Garamond, Archivo, Didact_Gothic } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import DesignLabGate from "@/components/DesignLabGate";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import PressFx from "@/components/PressFx";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import HeroWarm from "@/components/HeroWarm";
import { categories } from "@/lib/data";

const prata = Prata({ weight: "400", subsets: ["latin"], variable: "--f-display", display: "swap" });
const cormorant = Cormorant_Garamond({ weight: ["500"], style: ["italic"], subsets: ["latin"], variable: "--f-sub", display: "swap" });
const didact = Didact_Gothic({ weight: "400", subsets: ["latin"], variable: "--f-title", display: "swap" }); // jewelry (product) titles
const archivo = Archivo({ weight: ["300", "400", "600", "700"], subsets: ["latin"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  title: "MEEKITAZ — Serious diamonds, worn lightly.",
  description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
};
export const viewport: Viewport = { themeColor: "#C4DEEE", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${prata.variable} ${cormorant.variable} ${archivo.variable} ${didact.variable}`}>
      <body>
        <CartProvider>
          <Nav />
          <HeroWarm map={Object.fromEntries(categories.map(c => [c.slug, { d: c.desktop, m: c.mobile }]))} />
          <div className="mk-page" id="mk-page">{children}</div>
          <Footer />
          <Toast />
          <PressFx />
          <CartDrawer />
          <DesignLabGate />
        </CartProvider>
      </body>
    </html>
  );
}
