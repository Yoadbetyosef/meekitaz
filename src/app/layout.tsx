import type { Metadata, Viewport } from "next";
import { Prata, Cormorant_Garamond, Archivo, Jost } from "next/font/google";
import { brand, brandCss } from "@/brands";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import HeroWarm from "@/components/HeroWarm";
import { categories } from "@/lib/data";

const prata = Prata({ weight: "400", subsets: ["latin"], variable: "--f-display", display: "swap" });
const cormorant = Cormorant_Garamond({ weight: ["500"], style: ["italic"], subsets: ["latin"], variable: "--f-sub", display: "swap" });
const archivo = Archivo({ weight: ["300", "400", "600", "700"], subsets: ["latin"], variable: "--f-body", display: "swap" });
// TG Jewellers: Cormorant Garamond for display, Jost for body (Pastel option)
const cormorantDisplay = Cormorant_Garamond({ weight: ["300", "400", "500"], style: ["normal", "italic"], subsets: ["latin"], variable: "--f-display-tg", display: "swap" });
const jost = Jost({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--f-body-tg", display: "swap" });

export const metadata: Metadata = {
  title: brand.title,
  description: brand.description,
};
export const viewport: Viewport = { themeColor: brand.themeColor, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${prata.variable} ${cormorant.variable} ${archivo.variable} ${cormorantDisplay.variable} ${jost.variable}`} data-brand={brand.key}>
      <head>{brandCss && <style>{`:root{${brandCss}}`}</style>}</head>
      <body>
        <CartProvider>
          <Nav />
          <HeroWarm map={Object.fromEntries(categories.map(c => [c.slug, { d: c.desktop, m: c.mobile }]))} />
          {children}
          <Footer />
          <Toast />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
