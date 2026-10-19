"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify";
import { METAL_SWATCH, shownMetals } from "@/lib/designs";
import { isCleaned, photoSrc } from "@/lib/img";

const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);
const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;

/** One card per design. The three gold dots swap the photo, link and price in place; the product page still offers every metal. */
export default function DesignCard({ p }: { p: Product }) {
  const metals = shownMetals(p);
  const [metal, setMetal] = useState(p.metal || metals[0]?.metal || "");
  const cur = metals.find(v => v.metal === metal) || { metal: p.metal || "", handle: p.handle, title: p.title, image: p.image, price: p.price, compareAt: p.compareAt };
  const title = (p.variants && p.variants.length > 1) ? cur.title.replace(/^(Rose gold|Yellow gold|White gold|Platinum|Silver) /i, "") : cur.title;
  return (
    <Link href={`/products/${cur.handle}`} className="pcard">
      <div className="pcard-img">{cur.image ? <Image src={photoSrc(cur.image.url, 700, cur.title)} alt={cur.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" quality={75} unoptimized={isCleaned(photoSrc(cur.image.url, 700, cur.title))} /> : <Gem />}</div>
      <div className="pcard-txt">
        <b>{title}</b>
        {metals.length > 1 && (
          <span className="pc-metals" aria-label="Metal">
            {metals.map(v => <i key={v.metal} className={v.metal === metal ? "on" : ""} style={{ background: METAL_SWATCH[v.metal] || "#ddd" }} title={v.metal} onClick={e => { e.preventDefault(); e.stopPropagation(); setMetal(v.metal); }} />)}
          </span>
        )}
        <span className="price">{usd(cur.price, p.currency)}{cur.compareAt ? <s className="was">{usd(cur.compareAt, p.currency)}</s> : null}</span>
      </div>
    </Link>
  );
}
