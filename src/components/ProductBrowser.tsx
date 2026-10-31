"use client";
import { fillPage } from "@/lib/designs";
import DesignCard from "./DesignCard";
import GridMood, { type Reveal } from "./GridMood";
import { Fragment, useState } from "react";
import type { Product } from "@/lib/shopify";

// Mood clips per category (silent, looping). Hosted on the Higgsfield CDN; move to /public/media to self-host.
const MOOD: Record<string, { src: string; poster: string; reveal?: Reveal }> = {
  gemstones: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261022_152830_ac33aa34-4a67-4562-999f-dc78c0d9ea1c.mp4", poster: "/_next/image?url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_3DSL63TGngiexHNYyHPnuPUiRZB%2Fhf_20261022_152212_65e6ebf6-a803-41d2-b08f-39da47bf3e46.png&w=1080&q=75", reveal: { tag: "Gemstones", l1: "Color,", l2: "worn lightly.", cta: "Shop the look", href: "/products/pear-cut-emerald-stud-earrings-in-yellow-gold-with-basket-setting" } },
  earrings: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_155403_077e3a3c-af03-47fe-b905-7f55fefe401b.mp4", poster: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261019_202431_3c1ef1d0-1b33-46e4-8c3e-e06be191f4ef.png" },
  bands: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_010122_488fa782-706a-46c5-9884-95593bf3210f.mp4", poster: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_005300_520e34ad-6539-4260-82ac-59d4202aeb20.png", reveal: { tag: "Wedding bands", l1: "The quiet one next to", l2: "the loud one.", cta: "Shop the look", href: "/products/yellow-gold-emerald-diamond-eternity-band" } },
  bracelets: { src: "/media/bracelets-mood.mp4", poster: "/media/bracelets-mood-poster.jpg" },
  necklaces: { src: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_192549_6e320ce1-d71d-450f-8631-a855c98ead92.mp4", poster: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261020_192442_05315264-b6cf-451e-a12d-9fb869e2f2b1.png", reveal: { tag: "Necklaces", l1: "Layered.", l2: "Then layered again.", cta: "Shop the look", href: "/products/yellow-gold-emerald-cut-diamond-cuban-link-chain-necklace" } },
};


export default function ProductBrowser({ handle, style = "", type = "", initial, hasNext: h0, cursor: c0, sort0 = "best", slot, slotAt = 4 }: { handle: string; style?: string; type?: string; initial: Product[]; hasNext: boolean; cursor: string | null; sort0?: string; slot?: React.ReactNode; slotAt?: number }) {
  const [items, setItems] = useState<Product[]>(initial);
  const [hasNext, setHasNext] = useState(h0);
  const [cursor, setCursor] = useState<string | null>(c0);
  const [sort, setSort] = useState(sort0); // must match the order the first page was fetched in, or the cursor points nowhere
  const [busy, setBusy] = useState(false);

  async function load(reset: boolean, s = sort) {
    setBusy(true);
    try {
      const page = (after: string | null) => { const q = new URLSearchParams({ handle, sort: s }); if (style) q.set("style", style); if (type) q.set("type", type); if (after) q.set("after", after); return fetch(`/api/products?${q}`).then(r => (r.ok ? r.json() : null)); };
      const r = await fillPage(reset ? [] : items, reset ? { cursor: null, hasNext: true } : { cursor, hasNext }, page);
      if (!(reset && r.failed && !r.items.length)) { setItems(r.items); setCursor(r.cursor); setHasNext(r.hasNext); }
    } finally { setBusy(false); }
  }
  return (
    <section className="grid-wrap" id="results" aria-label="The collection">
      <div className="wrap">
        <div className="dres">
          <h2>{[style, type].filter(Boolean).join(" \u00b7 ") || "The collection"}</h2>
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
              {MOOD[handle] && i === 4 && items.length > 4 && <GridMood src={MOOD[handle].src} poster={MOOD[handle].poster} reveal={MOOD[handle].reveal} />}
              {slot && i === slotAt && <div className="pgrid-slot">{slot}</div>}
              <DesignCard p={p} />
            </Fragment>
          ))}
        </div>
        {hasNext && <div className="dmore"><button type="button" onClick={() => load(false)} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
