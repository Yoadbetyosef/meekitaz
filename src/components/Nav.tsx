"use client";
import Logo from "./Logo";
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
  const [wishN, setWishN] = useState(0);
  useEffect(() => { const r = () => { try { setWishN(JSON.parse(localStorage.getItem("mk_wish") || "[]").length); } catch { setWishN(0); } }; r(); window.addEventListener("mk-wish", r); return () => window.removeEventListener("mk-wish", r); }, []);
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
  return (
    <>
      <nav className="nav" aria-label="Main">
        <Link href="/" className="brand" aria-label="Meekitaz, home"><Logo className="brand-logo" /></Link>
        <div className="nav-r">
          <button className="nav-wish" aria-label={`My Dream list${wishN ? `, ${wishN} saved` : ""}`} onClick={() => { setOpen(false); openCart(false); window.dispatchEvent(new Event("mk-dream-open")); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.6 7 4.6c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>
            {wishN > 0 && <b>{wishN}</b>}
          </button>
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
