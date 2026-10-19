"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify";
import { photoSrc, isCleaned } from "@/lib/img";

const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;
const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);

export default function ProductBrowser({ handle, style = "", initial, hasNext: h0, cursor: c0 }: { handle: string; style?: string; initial: Product[]; hasNext: boolean; cursor: string | null }) {
  const [items, setItems] = useState<Product[]>(initial);
  const [hasNext, setHasNext] = useState(h0);
  const [cursor, setCursor] = useState<string | null>(c0);
  const [sort, setSort] = useState("best");
  const [busy, setBusy] = useState(false);

  async function load(reset: boolean, s = sort) {
    setBusy(true);
    try {
      const q = new URLSearchParams({ handle, sort: s }); if (style) q.set("style", style); if (!reset && cursor) q.set("after", cursor);
      const r = await fetch(`/api/products?${q}`); const j = await r.json();
      if (r.ok) { setItems(x => (reset ? j.products : x.concat(j.products))); setHasNext(j.hasNext); setCursor(j.cursor); }
    } finally { setBusy(false); }
  }
  return (
    <section className="grid-wrap" id="results" aria-label="The collection">
      <div className="wrap">
        <div className="dres">
          <h2>{style ? style : "The collection"}</h2>
          <label className="dsort">Sort
            <select value={sort} onChange={e => { setSort(e.target.value); load(true, e.target.value); }}>
              <option value="best">Best selling</option><option value="new">Newest</option>
              <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className="pgrid">
          {items.map(p => (
            <Link key={p.id} href={`/products/${p.handle}`} className="pcard">
              <div className="pcard-img">{p.image ? <Image src={photoSrc(p.image.url, 700, p.title)} alt={p.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" quality={75} unoptimized={isCleaned(photoSrc(p.image.url, 700, p.title))} /> : <Gem />}</div>
              <div className="pcard-txt"><b>{p.title}</b><span className="price">{usd(p.price, p.currency)}{p.compareAt ? <s className="was">{usd(p.compareAt, p.currency)}</s> : null}</span></div>
            </Link>
          ))}
        </div>
        {hasNext && <div className="dmore"><button type="button" onClick={() => load(false)} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
