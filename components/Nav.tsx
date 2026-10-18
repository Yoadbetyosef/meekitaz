"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { menuTiles } from "@/lib/data";
import { useCart } from "./CartProvider";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { cart, setOpen: openCart } = useCart();
  const count = cart?.totalQuantity ?? 0;
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return (
    <>
      <div className="tstrip" aria-hidden="true"><div className="tstrip-track">{[0, 1].map(k => (
        <span key={k}>MADE WITH LAB-GROWN DIAMONDS <i>✦</i> IGI / GIA CERTIFIED <i>✦</i> 30-DAY FREE RETURNS <i>✦</i> LIFETIME WARRANTY <i>✦</i> FREE INSURED SHIPPING <i>✦</i> SERIOUS DIAMONDS, WORN LIGHTLY <i>✦</i>&nbsp;</span>
      ))}</div></div>
      <nav className="nav" aria-label="Main">
        <Link href="/" className="brand">MEEKITAZ<i>©</i></Link>
        <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="menu" onClick={() => setOpen(o => !o)}><i /><i /><i /></button>
      </nav>
      <button className="cart" aria-label={`Open bag${count ? `, ${count} items` : ""}`} onClick={() => { setOpen(false); openCart(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 8h14l-1.2 12H6.2L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
        {count > 0 && <b>{count}</b>}
      </button>
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
