"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import WishHeart, { ShareArrow } from "@/components/WishHeart";
import type { ReelItem } from "@/lib/shopify";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const TYPES = [["", "All"], ["Ring", "Rings"], ["Earrings", "Earrings"], ["Bracelet", "Bracelets"], ["Necklace", "Necklaces"], ["Band", "Bands"]] as const;

/* The Reel — vertical, full-screen, one video per screen (design 3: no card, text on the video over a fade, butter price, pink glass button).
   Pages in from /api/reel as you scroll; Claim adds the piece to the bag. */
export default function Reel({ initial, hasNext: h0, cursor: c0 }: { initial: ReelItem[]; hasNext: boolean; cursor: string | null }) {
  const [items, setItems] = useState(initial), [hasNext, setHasNext] = useState(h0), [cursor, setCursor] = useState(c0), [type, setType] = useState(""), [i, setI] = useState(0), [busy, setBusy] = useState("");
  const wrap = useRef<HTMLDivElement>(null), loading = useRef(false);
  const cart = useCart();

  useEffect(() => { // which slide is on screen: play it, pause the rest
    const root = wrap.current; if (!root) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target.querySelector("video"); const idx = +(e.target.getAttribute("data-i") || 0);
      if (e.isIntersecting) { setI(idx); v?.play().catch(() => {}); } else v?.pause();
    }), { root, threshold: 0.6 });
    root.querySelectorAll(".rl-slide").forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => { // more when near the end
    if (!hasNext || loading.current || i < items.length - 4) return;
    loading.current = true;
    fetch(`/api/reel?first=24${cursor ? `&after=${encodeURIComponent(cursor)}` : ""}${type ? `&type=${type}` : ""}`).then(r => r.json()).then(r => { setItems(x => [...x, ...r.items]); setHasNext(r.hasNext); setCursor(r.cursor); }).finally(() => { loading.current = false; });
  }, [i, items.length, hasNext, cursor, type]);

  useEffect(() => { // the feed owns the screen: no page scroll behind it, arrow keys move it
    document.body.classList.add("reel-open");
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); go(e.key === "ArrowDown" ? 1 : -1); } };
    window.addEventListener("keydown", key);
    return () => { document.body.classList.remove("reel-open"); window.removeEventListener("keydown", key); };
  }, []);

  useEffect(() => { // desktop: one wheel notch = one piece (the snap container alone jitters with a trackpad)
    const el = wrap.current; if (!el || !window.matchMedia("(min-width:768px)").matches) return;
    let lock = 0;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const now = Date.now(); if (now - lock < 650 || Math.abs(e.deltaY) < 8) return; lock = now; el.scrollBy({ top: Math.sign(e.deltaY) * el.clientHeight, behavior: "smooth" }); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => { // deep link #reel-xxxx opens on that piece
    const h = location.hash.slice(1); if (!h) return;
    const el = wrap.current?.querySelector(`[data-handle="${h}"]`); el?.scrollIntoView();
  }, []);

  const pick = (t: string) => { setType(t); loading.current = true; setItems([]); fetch(`/api/reel?first=24${t ? `&type=${t}` : ""}`).then(r => r.json()).then(r => { setItems(r.items); setHasNext(r.hasNext); setCursor(r.cursor); wrap.current?.scrollTo({ top: 0 }); }).finally(() => { loading.current = false; }); };
  const go = (d: number) => { const el = wrap.current; if (!el) return; el.scrollBy({ top: d * el.clientHeight, behavior: "smooth" }); };
  const claim = async (it: ReelItem) => { setBusy(it.handle); const r = await cart.add(it.variantId); setBusy(""); if (!r.ok) alert(r.error || "Could not add"); };

  return (
    <div className="rl">
      <aside className="rl-aside">
        <p className="rl-aside-h"><span className="rl-tag"><i />Ready to ship</span></p>
        <h1 className="rl-aside-t">The Reel.<em>One of each.</em></h1>
        <div className="rl-chips">{TYPES.map(([v, l]) => <button key={v} className={type === v ? "on" : ""} onClick={() => pick(v)}>{l}</button>)}</div>
        <p className="rl-aside-p">Swipe or use the arrows. Every piece is filmed and ships within 48 hours.</p>
        <div className="rl-arrows"><button onClick={() => go(-1)} aria-label="Previous">&uarr;</button><button onClick={() => go(1)} aria-label="Next">&darr;</button></div>
      </aside>
      <div className="rl-phone">
      <div className="rl-top"><Link href="/" className="rl-wm">Meekitaz</Link><span className="rl-tag rl-tag-m"><i />Ready to ship</span><span className="rl-n">{items.length ? `${i + 1}/${items.length}${hasNext ? "+" : ""}` : ""}</span></div>
      <div className="rl-wrap" ref={wrap}>
        {items.map((it, k) => (
          <div className="rl-slide" key={it.handle} data-i={k} data-handle={it.handle}>
            {it.video ? <video src={it.video} muted loop playsInline preload={k < 2 ? "auto" : "metadata"} poster={it.image} /> : <img src={it.image} alt="" />}
            <div className="rl-side">
              <WishHeart item={{ handle: it.handle, title: it.title, image: it.image || "", price: it.price, compareAt: it.compare || null }} className="big" />
              <ShareArrow item={{ handle: it.handle, title: it.title, image: it.image || "", price: it.price, compareAt: it.compare || null }} className="big" />
              <Link href={`/products/${it.handle}`} aria-label="Details">&#x2197;</Link>
            </div>
            <div className="rl-ov">
              <h3>{it.title}</h3>
              <p>{it.detail}</p>
              <b>{usd(it.price)}</b>
              <button className="rl-btn" onClick={() => claim(it)} disabled={busy === it.handle}><span>{busy === it.handle ? "Adding to bag…" : `Add to bag · ${usd(it.price)}`}</span><i>&rarr;</i></button>
              <small>One of each · ships in 48 hours · 30-day returns</small>
            </div>
          </div>
        ))}
        {!items.length && <div className="rl-slide rl-empty">Loading the reel…</div>}
      </div>
      </div>
    </div>
  );
}
