"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DiamondFilters, { DEFAULT_FILTERS, type DFilters } from "./DiamondFilters";

type Item = { id: string; vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null; cut: string | null; lab: string; image: string; price: number };
const COLORS = ["D", "E", "F", "G", "H", "I"], CLAR = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2"];
const span = (sel: string[], order: string[]) => { const i = sel.map(x => order.indexOf(x)).filter(x => x >= 0); return i.length ? [order[Math.min(...i)], order[Math.max(...i)]] : ["", ""]; };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function DiamondsBrowser() {
  const style = useSearchParams().get("style") || "";
  const [f, setF] = useState<DFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("price_asc");
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "off" | "error">("loading");
  const [busy, setBusy] = useState(false);

  const qs = useCallback((p: number) => {
    const [cf, ct] = span(f.color, COLORS), [lf, lt] = span(f.clarity, CLAR);
    const q = new URLSearchParams({ caratFrom: String(f.carat[0]), caratTo: String(f.carat[1]), priceFrom: String(f.price[0]), priceTo: String(f.price[1]), sort, page: String(p) });
    if (style) q.set("shapes", style);
    if (cf) { q.set("colorFrom", cf); q.set("colorTo", ct); }
    if (lf) { q.set("clarityFrom", lf); q.set("clarityTo", lt); }
    return q.toString();
  }, [f, sort, style]);

  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/diamonds?${qs(1)}`, { signal: ac.signal });
        const j = await r.json();
        if (!r.ok) throw new Error("x");
        if (j.configured === false) { setState("off"); return; }
        setItems(j.items); setTotal(j.total); setPage(1); setState(j.items.length ? "ready" : "empty");
      } catch (e) { if ((e as Error)?.name !== "AbortError") setState("error"); }
    }, 350);
    return () => { clearTimeout(t); ac.abort(); };
  }, [qs]);

  async function more() {
    setBusy(true);
    try {
      const r = await fetch(`/api/diamonds?${qs(page + 1)}`); const j = await r.json();
      if (r.ok) { setItems(x => [...x, ...j.items]); setPage(page + 1); }
    } finally { setBusy(false); }
  }

  return (
    <>
      <DiamondFilters f={f} setF={setF} />
      <section className="grid-wrap" aria-label="The collection">
        <div className="wrap">
          <div className="dres">
            <div><h2>The collection</h2>{state === "ready" && <p className="dcount">{total.toLocaleString("en-US")} lab-grown diamonds{style ? <> · <Link href="/diamonds" className="dchip">{style} ×</Link></> : null}</p>}</div>
            <label className="dsort">Sort
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
                <option value="carat_desc">Carat: large to small</option><option value="carat_asc">Carat: small to large</option>
              </select>
            </label>
          </div>
          {state === "loading" && <p className="dmsg">Finding stones…</p>}
          {state === "off" && <p className="dmsg">Our diamond inventory is connecting. Please check back shortly.</p>}
          {state === "error" && <p className="dmsg">We couldn&apos;t load diamonds just now. Please refresh in a moment.</p>}
          {state === "empty" && <p className="dmsg">No diamonds match these filters. Try widening carat, price, color or clarity.</p>}
          {state === "ready" && (
            <>
              <div className="pgrid">
                {items.map(d => (
                  <Link key={d.id} href={`/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}`} className="pcard dcard">
                    <div className="pcard-img">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.image} alt={`${d.carat.toFixed(2)} carat ${d.shape} diamond`} loading="lazy" referrerPolicy="no-referrer" /></div>
                    <div className="pcard-txt"><b>{d.carat.toFixed(2)} ct {d.shape}</b><p>{[d.color, d.clarity, d.cut ? d.cut + " cut" : null, d.lab].filter(Boolean).join(" · ")}</p><span className="price">{usd(d.price)}</span></div>
                  </Link>
                ))}
              </div>
              {page * 24 < total && <div className="dmore"><button type="button" onClick={more} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
            </>
          )}
        </div>
      </section>
    </>
  );
}
