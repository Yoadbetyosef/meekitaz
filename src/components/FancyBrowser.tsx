"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StoneCard, { type Item } from "./StoneCard";
import { Dual, Scale } from "./DiamondFilters";

const INTENSITIES = ["Light", "Fancy Light", "Fancy", "Intense", "Vivid", "Deep"];
const SHAPES = ["Round", "Oval", "Cushion", "Pear", "Radiant", "Emerald", "Princess", "Marquise", "Asscher", "Heart"];
const TINT: Record<string, string> = { Pink: "#e8527f", Blue: "#2f6fdb", Yellow: "#e9b911", Green: "#2fa26a", Orange: "#f08a24", Brown: "#8a5a3b" };
type F = { carat: [number, number]; price: [number, number]; inten: [number, number]; shapes: string[] };
const DEF: F = { carat: [0.5, 20], price: [100, 50000], inten: [0, 5], shapes: [] };
type Facet = { color: string; count: number; image: string };

const pair = (v: string | null, lo: number, hi: number, def: [number, number], int = false): [number, number] => {
  const m = v?.match(/^(-?[\d.]+)-(-?[\d.]+)$/); if (!m) return def;
  const a = Number(m[1]), b = Number(m[2]);
  return isFinite(a) && isFinite(b) && a >= lo && b <= hi && a <= b && (!int || (Number.isInteger(a) && Number.isInteger(b))) ? [a, b] : def;
};
const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];

export default function FancyBrowser({ embedded = false }: { embedded?: boolean } = {}) {
  const sp = useSearchParams(), router = useRouter(), path = usePathname();
  const color = TINT[sp.get("color") || ""] ? (sp.get("color") as string) : "";
  const [f, setF] = useState<F>(() => ({
    carat: pair(sp.get("c"), 0.5, 20, DEF.carat), price: pair(sp.get("p"), 100, 50000, DEF.price), inten: pair(sp.get("int"), 0, 5, DEF.inten, true),
    shapes: (sp.get("sh") || sp.get("style") || "").split(",").filter(x => SHAPES.includes(x)),
  }));
  const [sort, setSort] = useState(() => (["price_asc", "price_desc", "carat_desc", "intensity_desc"].includes(sp.get("sort") || "") ? (sp.get("sort") as string) : "price_asc"));
  const [items, setItems] = useState<Item[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "off" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const restore = useRef<{ pages: number; y: number } | null>(null);

  // keep the address bar in step with the filters so Back (and a shared link) restores them
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const put = (k: string, v: string | null) => (v === null ? q.delete(k) : q.set(k, v));
    put("c", same(f.carat, DEF.carat) ? null : f.carat.join("-")); put("p", same(f.price, DEF.price) ? null : f.price.join("-"));
    put("int", same(f.inten, DEF.inten) ? null : f.inten.join("-")); put("sh", f.shapes.length ? f.shapes.join(",") : null);
    put("sort", sort === "price_asc" ? null : sort);
    const next = window.location.pathname + (q.toString() ? "?" + q : "");
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", next);
  }, [f, sort]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fmd"); if (!raw) return;
      const v = JSON.parse(raw); sessionStorage.removeItem("fmd");
      if (v.q === window.location.search && v.pages >= 1) restore.current = { pages: v.pages, y: v.y || 0 };
    } catch { /* ignore */ }
  }, []);
  const remember = () => { try { sessionStorage.setItem("fmd", JSON.stringify({ q: window.location.search, pages: page, y: window.scrollY })); } catch { /* ignore */ } };

  const qs = useCallback((p: number) => {
    const q = new URLSearchParams({ caratFrom: String(f.carat[0]), priceFrom: String(f.price[0]), intFrom: String(f.inten[0]), intTo: String(f.inten[1]), sort, page: String(p) });
    if (f.carat[1] < 20) q.set("caratTo", String(f.carat[1]));
    if (f.price[1] < 50000) q.set("priceTo", String(f.price[1]));
    if (f.shapes.length) q.set("shapes", f.shapes.join(","));
    if (color) q.set("color", color);
    return q.toString();
  }, [f, sort, color]);

  const [tries, setTries] = useState(0);
  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/fancy?${qs(1)}`, { signal: ac.signal });
        const j = await r.json();
        if (!r.ok) { if (tries < 4) { setTimeout(() => setTries(x => x + 1), 6000); return; } throw new Error("x"); }
        if (j.configured === false) { setState("off"); return; }
        let all: Item[] = j.items, pg = 1;
        const rs = restore.current; restore.current = null;
        if (rs && rs.pages > 1 && j.items.length) {
          const rest = await Promise.all(Array.from({ length: rs.pages - 1 }, (_, i) => fetch(`/api/fancy?${qs(i + 2)}`, { signal: ac.signal }).then(x => x.json()).catch(() => null)));
          for (const x of rest) { if (x?.items) { all = all.concat(x.items); pg++; } }
        }
        setFacets(j.facets || []); setItems(all); setTotal(j.total); setPage(pg); setPlaying(null); setState(all.length ? "ready" : "empty");
        if (rs) { const go = () => window.scrollTo({ top: rs.y }); setTimeout(go, 80); setTimeout(go, 450); setTimeout(go, 1100); }
      } catch (e) { if ((e as Error)?.name !== "AbortError") setState("error"); }
    }, 350);
    return () => { clearTimeout(t); ac.abort(); };
  }, [qs, tries]);

  async function more() {
    setBusy(true);
    try {
      const r = await fetch(`/api/fancy?${qs(page + 1)}`); const j = await r.json();
      if (r.ok) { setItems(x => [...x, ...j.items]); setPage(page + 1); }
    } finally { setBusy(false); }
  }
  function pickColor(c: string) {
    const q = new URLSearchParams(window.location.search);
    if (color === c) q.delete("color"); else q.set("color", c);
    router.replace(q.toString() ? `${path}?${q}` : path, { scroll: false });
    if (color !== c) setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  const tint = TINT[color] || "#c94f8b";

  return (
    <>
      {!embedded && <section className="shapes" aria-label="Shop by color">
        <div className="wrap">
          <div className="sp-head"><small className="eyebrow">Shop by color</small><h2>Pick your color</h2></div>
          <div className={`sp-row${color ? " has-sel" : ""}`}>
            {(facets.length ? facets : Object.keys(TINT).map(c => ({ color: c, count: 0, image: "" }))).map(c => (
              <button key={c.color} type="button" className={`sp${color === c.color ? " on" : ""}`} aria-pressed={color === c.color} onClick={() => pickColor(c.color)}>
                <span className="sp-img" style={{ background: TINT[c.color] + "33" }}>{/* eslint-disable-next-line @next/next/no-img-element */}{c.image && <img src={c.image} alt={`${c.color} fancy diamond`} referrerPolicy="no-referrer" />}</span>
                <b>{c.color}</b>{c.count > 0 && <small className="sp-n">{c.count.toLocaleString("en-US")} stones</small>}
              </button>
            ))}
          </div>
        </div>
      </section>}

      <section className="filters" aria-label="Filter fancy colors">
        <div className="wrap">
          <div className="dfp" style={{ ["--tint" as string]: tint }}>
            <div className="dfp-head"><div><small className="eyebrow">Refine</small><h2>Carat, price, intensity, shape</h2></div><button className="flt-reset" type="button" onClick={() => setF(DEF)}>Reset</button></div>
            <Dual label="Carat" min={0.5} max={20} step={0.1} lo={f.carat[0]} hi={f.carat[1]} fmt={v => v.toFixed(1) + " ct"} onChange={(a, b) => setF({ ...f, carat: [a, b] })} />
            <Dual label="Price" min={100} max={50000} step={100} lo={f.price[0]} hi={f.price[1]} fmt={v => "$" + Math.round(v).toLocaleString("en-US")} onChange={(a, b) => setF({ ...f, price: [a, b] })} />
            <Scale label="Intensity" kind="int" items={INTENSITIES} notes={["Pastel", "", "", "", "Richest", "Darkest"]} hint="Vivid is the richest saturation. Light is pastel. Tap one grade, then another, for a range." value={f.inten} onChange={v => setF({ ...f, inten: v })} />
            <div className="dfp-blk"><span className="dfp-lbl">Shape</span>
              <div className="dfp-pills">{SHAPES.map(sh => <button key={sh} type="button" className={f.shapes.includes(sh) ? "on" : ""} onClick={() => setF({ ...f, shapes: f.shapes.includes(sh) ? f.shapes.filter(x => x !== sh) : [...f.shapes, sh] })}>{sh}</button>)}</div>
              <div className="dfp-hint">Choose any number, or none for all shapes.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-wrap" id="results" aria-label="The collection">
        <div className="wrap">
          <div className="dres">
            <div><h2>The collection</h2>{state === "ready" && <p className="dcount">{total.toLocaleString("en-US")} fancy-color diamonds{color ? <> · <button type="button" className="dchip" onClick={() => pickColor(color)}>{color} ×</button></> : null}</p>}</div>
            <label className="dsort">Sort
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
                <option value="carat_desc">Carat: large to small</option><option value="intensity_desc">Intensity: richest first</option>
              </select>
            </label>
          </div>
          {state === "loading" && <p className="dmsg">{tries ? "Still gathering the coloured stones — this can take a minute the first time. Hang on…" : "Finding colors… the first visit can take a few seconds."}</p>}
          {state === "off" && <p className="dmsg">Our diamond inventory is connecting. Please check back shortly.</p>}
          {state === "error" && <p className="dmsg">We couldn&apos;t load fancy colors just now. Please refresh in a moment.</p>}
          {state === "empty" && <p className="dmsg">No diamonds match these filters. Try widening carat, price or intensity.</p>}
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
