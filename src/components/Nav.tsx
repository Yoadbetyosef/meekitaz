"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { menuTiles } from "@/lib/data";
import { useCart } from "./CartProvider";
import SearchPalette from "./SearchPalette";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const pathname = usePathname();
  const { bagCount, setOpen: openCart } = useCart();
  const count = bagCount;
  useEffect(() => { setOpen(false); setSearching(false); }, [pathname]);
  // ⌘K / Ctrl+K opens search from anywhere
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(false); openCart(false); setSearching(s => !s); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [openCart]);
  useEffect(() => { document.body.style.overflow = open || searching ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open, searching]);
  // Glass header: white text while the bar sits over a hero photo, ink over the page.
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const check = () => {
      raf = 0;
      if (open || searching) { delete root.dataset.navphoto; return; }
      const y = window.innerWidth < 768 ? 47 : 67; // the bar's vertical centre
      const over = [...document.querySelectorAll<HTMLElement>(".hero, .cat-hero")].some(el => { const r = el.getBoundingClientRect(); return r.top < y && r.bottom > y; });
      if (over) root.dataset.navphoto = ""; else delete root.dataset.navphoto;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check(); const t = setTimeout(check, 400);
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); clearTimeout(t); delete root.dataset.navphoto; };
  }, [pathname, open, searching]);
  return (
    <>
      <nav className="nav" aria-label="Main">
        <Link href="/" className="brand">MEEKITAZ<i>©</i></Link>
        <div className="nav-r">
          <button className="nav-search" aria-label="Search" onClick={() => { setOpen(false); openCart(false); setSearching(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
          </button>
          <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="menu" onClick={() => setOpen(o => !o)}><i /><i /><i /></button>
        </div>
      </nav>
      <button className="cart" aria-label={`Open bag${count ? `, ${count} items` : ""}`} onClick={() => { setOpen(false); openCart(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 8h14l-1.2 12H6.2L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
        {count > 0 && <b>{count}</b>}
      </button>
      <SearchPalette open={searching} onClose={() => setSearching(false)} />
      <div id="menu" className={`menu${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="menu-in">
          <div className="mgrid">
            {menuTiles.map((t, i) => (
              <Link key={t.href} href={t.href} style={{ transitionDelay: `${80 + i * 60}ms`, "--pos": t.pos, "--pos-m": t.posM } as React.CSSProperties}>
                {open && <Image src={t.img} alt="" fill sizes="(max-width:767px) 50vw, 33vw" />}
                <span>{t.sub && <small>{t.sub}</small>}{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
