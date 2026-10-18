import type { Metadata, Viewport } from "next";
import { Prata, Cormorant_Garamond, Archivo } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";

const prata = Prata({ weight: "400", subsets: ["latin"], variable: "--f-display", display: "swap" });
const cormorant = Cormorant_Garamond({ weight: ["500"], style: ["italic"], subsets: ["latin"], variable: "--f-sub", display: "swap" });
const archivo = Archivo({ weight: ["300", "400", "600", "700"], subsets: ["latin"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  title: "MEEKITAZ — Serious diamonds, worn lightly.",
  description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
};
export const viewport: Viewport = { themeColor: "#C4DEEE", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${prata.variable} ${cormorant.variable} ${archivo.variable}`}>
      <body>
        <CartProvider>
          <Nav />
          {children}
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
