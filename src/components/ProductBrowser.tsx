"use client";
import { collapseDesigns } from "@/lib/designs";
import DesignCard from "./DesignCard";
import { useState } from "react";
import type { Product } from "@/lib/shopify";


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
      if (r.ok) { setItems(x => collapseDesigns(reset ? j.products : x.concat(j.products))); setHasNext(j.hasNext); setCursor(j.cursor); }
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
            <DesignCard key={p.id} p={p} />
          ))}
        </div>
        {hasNext && <div className="dmore"><button type="button" onClick={() => load(false)} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
