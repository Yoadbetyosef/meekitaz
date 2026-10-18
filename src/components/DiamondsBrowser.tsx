"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StoneCard, { type Item as CardItem } from "./StoneCard";
import DiamondFilters, { COLORS, CLARITIES, DEFAULT_FILTERS, type DFilters } from "./DiamondFilters";

type Item = CardItem;
const DEF = DEFAULT_FILTERS;
const pair = (v: string | null, lo: number, hi: number, def: [number, number], int = false): [number, number] => {
  const m = v?.match(/^(-?[\d.]+)-(-?[\d.]+)$/); if (!m) return def;
  const a = Number(m[1]), b = Number(m[2]);
  return isFinite(a) && isFinite(b) && a >= lo && b <= hi && a <= b && (!int || (Number.isInteger(a) && Number.isInteger(b))) ? [a, b] : def;
};
const parseF = (sp: URLSearchParams): DFilters => ({
  carat: pair(sp.get("c"), 0.5, 20, DEF.carat), price: pair(sp.get("p"), 100, 50000, DEF.price),
  color: pair(sp.get("col"), 0, 5, DEF.color, true), clarity: pair(sp.get("cl"), 0, 5, DEF.clarity, true),
});
const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function DiamondsBrowser() {
  const sp = useSearchParams();
  const style = sp.get("style") || "";
  const [f, setF] = useState<DFilters>(() => parseF(sp));
  const [sort, setSort] = useState(() => (["price_asc", "price_desc", "carat_desc", "carat_asc"].includes(sp.get("sort") || "") ? (sp.get("sort") as string) : "price_asc"));
  const restore = useRef<{ pages: number; y: number } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "off" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const put = (k: string, v: string | null) => (v === null ? q.delete(k) : q.set(k, v));
    put("c", same(f.carat, DEF.carat) ? null : f.carat.join("-")); put("p", same(f.price, DEF.price) ? null : f.price.join("-"));
    put("col", same(f.color, DEF.color) ? null : f.color.join("-")); put("cl", same(f.clarity, DEF.clarity) ? null : f.clarity.join("-"));
    put("sort", sort === "price_asc" ? null : sort);
    const next = window.location.pathname + (q.toString() ? "?" + q : "");
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", next);
  }, [f, sort]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dmd"); if (!raw) return;
      const v = JSON.parse(raw); sessionStorage.removeItem("dmd");
      if (v.q === window.location.search && v.pages >= 1) restore.current = { pages: v.pages, y: v.y || 0 };
    } catch { /* ignore */ }
  }, []);
  const remember = () => { try { sessionStorage.setItem("dmd", JSON.stringify({ q: window.location.search, pages: page, y: window.scrollY })); } catch { /* ignore */ } };

  const qs = useCallback((p: number) => {
    const q = new URLSearchParams({
      caratFrom: String(f.carat[0]), priceFrom: String(f.price[0]), sort, page: String(p),
      colorFrom: COLORS[f.color[0]], colorTo: COLORS[f.color[1]], clarityFrom: CLARITIES[f.clarity[0]], clarityTo: CLARITIES[f.clarity[1]],
    });
    if (f.carat[1] < 20) q.set("caratTo", String(f.carat[1])); // top of the slider = no upper limit
    if (f.price[1] < 50000) q.set("priceTo", String(f.price[1]));
    if (style) q.set("shapes", style);
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
        let all: Item[] = j.items, pg = 1;
        const rs = restore.current; restore.current = null;
        if (rs && rs.pages > 1 && j.items.length) {
          const rest = await Promise.all(Array.from({ length: rs.pages - 1 }, (_, i) => fetch(`/api/diamonds?${qs(i + 2)}`, { signal: ac.signal }).then(r => r.json()).catch(() => null)));
          for (const x of rest) { if (x?.items) { all = all.concat(x.items); pg++; } }
        }
        setItems(all); setTotal(j.total); setPage(pg); setPlaying(null); setState(all.length ? "ready" : "empty");
        if (rs) { const go = () => window.scrollTo({ top: rs.y }); setTimeout(go, 80); setTimeout(go, 450); setTimeout(go, 1100); }
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
      <section className="grid-wrap" id="results" aria-label="The collection">
        <div className="wrap">
          <div className="dres">
            <div><h2>The collection</h2>{state === "ready" && <p className="dcount">{total.toLocaleString("en-US")} lab-grown diamonds{style ? <> · <Link href="/diamonds" scroll={false} className="dchip">{style} ×</Link></> : null}</p>}</div>
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
              <div className="pgrid">{items.map(d => <StoneCard key={d.id} d={d} playing={playing === d.id} setPlaying={setPlaying} onOpen={remember} />)}</div>
              {page * 24 < total && <div className="dmore"><button type="button" onClick={more} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
            </>
          )}
        </div>
      </section>
    </>
  );
}
