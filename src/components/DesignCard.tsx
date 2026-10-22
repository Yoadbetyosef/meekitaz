"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify";
import { METAL_LINE, shownMetals } from "@/lib/designs";
import { isCleaned, photoSrc } from "@/lib/img";

const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);
const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;

/** One card per design. The three gold dots swap the photo, link and price in place; the product page still offers every metal. */
export default function DesignCard({ p }: { p: Product }) {
  const metals = shownMetals(p);
  const [metal, setMetal] = useState(p.metal || metals[0]?.metal || "");
  const cur = metals.find(v => v.metal === metal) || { metal: p.metal || "", handle: p.handle, title: p.title, image: p.image, modelImage: p.modelImage, price: p.price, compareAt: p.compareAt };
  // the on-model photo: this metal's, or the design's (the model shot is made once per design, in yellow gold)
  const model = cur.modelImage || p.modelImage || metals.find(v => v.modelImage)?.modelImage;
  const [onModel, setOnModel] = useState(false); const [held, setHeld] = useState(false); // desktop: the left arrow keeps the piece photo while the pointer is still over the card // phones: a tap on the dots or a horizontal swipe flips the photo
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipeStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, t: Date.now() }; };
  const swipeEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null; if (!s || !model) return;
    const t = e.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    // a sideways swipe (not a vertical scroll, not a tap) flips the photo; the link does not open
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - s.t < 600) { e.preventDefault(); setOnModel(dx < 0 ? true : false); }
  };
  const title = (p.variants && p.variants.length > 1) ? cur.title.replace(/^(Rose gold|Yellow gold|White gold|Platinum|Silver) /i, "") : cur.title;
  return (
    <Link href={`/products/${cur.handle}`} className="pcard">
      <div className={`pcard-img${model ? " has-model" : ""}${onModel || (!cur.image && model) ? " on-model" : ""}${held ? " hold" : ""}`} onTouchStart={model ? swipeStart : undefined} onTouchEnd={model ? swipeEnd : undefined} onMouseLeave={model ? () => { setHeld(false); if (window.matchMedia("(hover:hover)").matches) setOnModel(false); } : undefined}>{model && <Image className="pcard-model" src={model} alt={`${cur.title} worn`} width={800} height={1000} sizes="(max-width:767px) 50vw, 380px" quality={78} />}{model && <button type="button" className="pcard-flip" aria-label={onModel ? "Show the piece" : "Show it worn"} onClick={e => { e.preventDefault(); e.stopPropagation(); setOnModel(v => !v); }}><i /><i /></button>}{model && <>
            <button type="button" className="pcard-arr l" aria-label="Show the piece" onClick={e => { e.preventDefault(); e.stopPropagation(); setOnModel(false); setHeld(true); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
            <button type="button" className="pcard-arr r" aria-label="Show it worn" onClick={e => { e.preventDefault(); e.stopPropagation(); setOnModel(true); setHeld(false); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
            <span className="pcard-bar" aria-hidden="true" />
          </>}{cur.image ? <Image src={photoSrc(cur.image.url, 700, cur.title)} alt={cur.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" quality={75} unoptimized={isCleaned(photoSrc(cur.image.url, 700, cur.title))} /> : <Gem />}</div>
      <div className="pcard-txt">
        <b>{title}</b>
        {metals.length > 1 && (
          <span className="pc-metals" aria-label="Metal">
            {metals.map(v => <i key={v.metal} className={v.metal === metal ? "on" : ""} style={{ "--lc": METAL_LINE[v.metal] || "#B3B8C0" } as React.CSSProperties} title={v.metal} onClick={e => { e.preventDefault(); e.stopPropagation(); setMetal(v.metal); }} />)}
          </span>
        )}
        <span className="price">{usd(cur.price, p.currency)}{cur.compareAt ? <s className="was">{usd(cur.compareAt, p.currency)}</s> : null}</span>
      </div>
    </Link>
  );
}
