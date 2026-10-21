import React from "react";
import { createRoot } from "react-dom/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import CartProvider from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import HeroWarm from "@/components/HeroWarm";
import Home from "@/app/page";
import { categories } from "@/lib/data";
import { brand, brandCss } from "@/brands";
document.documentElement.setAttribute("data-brand", brand.key);
if (brandCss) { const st = document.createElement("style"); st.textContent = `:root{${brandCss}}`; document.head.appendChild(st); }
createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <Nav />
    <HeroWarm map={Object.fromEntries(categories.map(c => [c.slug, { d: c.desktop, m: c.mobile }]))} />
    <Home />
    <Footer />
    <Toast />
    <CartDrawer />
  </CartProvider>
);
