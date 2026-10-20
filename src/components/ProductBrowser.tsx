"use client";
import { fillPage } from "@/lib/designs";
import DesignCard from "./DesignCard";
import GridMood from "./GridMood";
import { Fragment, useState } from "react";
import type { Product } from "@/lib/shopify";

// Mood clips per category (silent, looping). Hosted on the Higgsfield CDN; move to /public/media to self-host.
const MOOD: Record<string, { src: string; poster: string }> = {
  earrings: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_155403_077e3a3c-af03-47fe-b905-7f55fefe401b.mp4", poster: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261019_202431_3c1ef1d0-1b33-46e4-8c3e-e06be191f4ef.png" },
  bracelets: { src: "/media/bracelets-mood.mp4", poster: "/media/bracelets-mood-poster.jpg" },
  necklaces: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_192549_6e320ce1-d71d-450f-8631-a855c98ead92.mp4", poster: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_192442_05315264-b6cf-451e-a12d-9fb869e2f2b1.png" },
};


export default function ProductBrowser({ handle, style = "", initial, hasNext: h0, cursor: c0 }: { handle: string; style?: string; initial: Product[]; hasNext: boolean; cursor: string | null }) {
  const [items, setItems] = useState<Product[]>(initial);
  const [hasNext, setHasNext] = useState(h0);
  const [cursor, setCursor] = useState<string | null>(c0);
  const [sort, setSort] = useState("best");
  const [busy, setBusy] = useState(false);

  async function load(reset: boolean, s = sort) {
    setBusy(true);
    try {
      const page = (after: string | null) => { const q = new URLSearchParams({ handle, sort: s }); if (style) q.set("style", style); if (after) q.set("after", after); return fetch(`/api/products?${q}`).then(r => (r.ok ? r.json() : null)); };
      const r = await fillPage(reset ? [] : items, reset ? { cursor: null, hasNext: true } : { cursor, hasNext }, page);
      if (!(reset && r.failed && !r.items.length)) { setItems(r.items); setCursor(r.cursor); setHasNext(r.hasNext); }
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
          {items.map((p, i) => (
            <Fragment key={p.id}>
              {/* earrings: the silent mood clip sits after the first two rows (CSS order places it; 6 cards before it on desktop, 4 on phones) */}
              {MOOD[handle] && i === 4 && items.length > 4 && <GridMood src={MOOD[handle].src} poster={MOOD[handle].poster} />}
              <DesignCard p={p} />
            </Fragment>
          ))}
        </div>
        {hasNext && <div className="dmore"><button type="button" onClick={() => load(false)} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
