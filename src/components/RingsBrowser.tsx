"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/shopify";
import { photoSrc, isCleaned } from "@/lib/img";
import { RING_METALS, RING_PRICE, RING_SHAPES, RING_STYLES } from "@/lib/ringfilters";

const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);
const csv = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;
type Pop = "metal" | "shape" | "style" | "price" | null;

export default function RingsBrowser({ initial, hasNext: h0, cursor: c0 }: { initial: Product[]; hasNext: boolean; cursor: string | null }) {
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  const shapes = csv(sp.get("style")), metals = csv(sp.get("metal")), styles = csv(sp.get("look"));
  const sort = sp.get("sort") || "best";
  const pmin = Number(sp.get("min")) || RING_PRICE.min, pmax = Number(sp.get("max")) || RING_PRICE.max;
  const key = sp.toString();
  const isDefault = !shapes.length && !metals.length && !styles.length && !sp.get("min") && !sp.get("max") && sort === "best";

  const [items, setItems] = useState<Product[]>(isDefault ? initial : []); // a link with filters in it starts empty and loads its own results
  const [hasNext, setHasNext] = useState(isDefault ? h0 : false);
  const [cursor, setCursor] = useState<string | null>(isDefault ? c0 : null);
  const [busy, setBusy] = useState(!isDefault);
  const [pop, setPop] = useState<Pop>(null);
  const [price, setPrice] = useState<[number, number]>([pmin, pmax]);
  const wrap = useRef<HTMLDivElement>(null);

  const api = useCallback((after: string | null) => {
    const q = new URLSearchParams({ handle: "engagement-rings", sort });
    if (shapes.length) q.set("shape", shapes.join(",")); if (metals.length) q.set("metal", metals.join(",")); if (styles.length) q.set("look", styles.join(","));
    if (sp.get("min")) q.set("min", String(pmin)); if (sp.get("max")) q.set("max", String(pmax)); if (after) q.set("after", after);
    return fetch(`/api/products?${q}`).then(r => r.json());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; if (isDefault) return; }
    if (isDefault) { setItems(initial); setHasNext(h0); setCursor(c0); return; }
    let live = true; setBusy(true);
    api(null).then(j => { if (live && j.products) { setItems(j.products); setHasNext(j.hasNext); setCursor(j.cursor); } }).finally(() => live && setBusy(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { setPrice([pmin, pmax]); }, [pmin, pmax]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setPop(null); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);

  const set = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) { if (v) q.set(k, v); else q.delete(k); }
    router.replace(q.toString() ? `${path}?${q}` : path, { scroll: false });
  };
  const toggle = (param: string, cur: string[], v: string) => { const n = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]; set({ [param]: n.join(",") || null }); };
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const commitPrice = (lo: number, hi: number) => { setPrice([lo, hi]); clearTimeout(timer.current); timer.current = setTimeout(() => set({ min: lo > RING_PRICE.min ? String(lo) : null, max: hi < RING_PRICE.max ? String(hi) : null }), 350); };
  const reset = () => set({ style: null, metal: null, look: null, min: null, max: null });

  async function more() {
    if (!cursor || busy) return; setBusy(true);
    try { const j = await api(cursor); if (j.products) { setItems(x => x.concat(j.products)); setHasNext(j.hasNext); setCursor(j.cursor); } } finally { setBusy(false); }
  }
  const priceOn = pmin > RING_PRICE.min || pmax < RING_PRICE.max;
  const tags = useMemo(() => [
    ...shapes.map(v => ({ k: "style", v, l: v })), ...metals.map(v => ({ k: "metal", v, l: v })), ...styles.map(v => ({ k: "look", v, l: v })),
    ...(priceOn ? [{ k: "price", v: "", l: `${usd(pmin)} – ${pmax >= RING_PRICE.max ? usd(RING_PRICE.max) + "+" : usd(pmax)}` }] : []),
  ], [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const lab = (a: string[]) => (!a.length ? "Any" : a.length < 3 ? a.join(", ") : `${a.length} selected`);
  const chip = (id: Exclude<Pop, null>, label: string, value: string, body: React.ReactNode) => (
    <div className={`rf-chipw${pop === id ? " open" : ""}`}>
      <button type="button" className={`rf-chip${value !== "Any" ? " act" : ""}`} aria-expanded={pop === id} onClick={() => setPop(pop === id ? null : id)}><small>{label}</small><span>{value}</span></button>
      <div className="rf-pop" role="dialog" aria-label={label}><span className="rf-lbl">{label}</span>{body}</div>
    </div>
  );

  return (
    <section className="grid-wrap" id="results" aria-label="The collection">
      <div className="wrap" ref={wrap}>
        <div className="rf-bar">
          {chip("metal", "Metal", lab(metals), <div className="rf-sws">{RING_METALS.map(m => (
            <button key={m.label} type="button" className="rf-swl" aria-pressed={metals.includes(m.label)} onClick={() => toggle("metal", metals, m.label)}>
              <span className={`rf-sw${metals.includes(m.label) ? " on" : ""}`}><i style={{ background: m.color }} /></span>{m.label.replace(" gold", "")}</button>))}</div>)}
          {chip("shape", "Shape", lab(shapes), <div className="rf-pills">{RING_SHAPES.map(s => <button key={s} type="button" className={`rf-pill${shapes.includes(s) ? " on" : ""}`} aria-pressed={shapes.includes(s)} onClick={() => toggle("style", shapes, s)}>{s}</button>)}</div>)}
          {chip("style", "Style", lab(styles), <div>{RING_STYLES.map(s => (
            <label key={s.label} className="rf-chk"><input type="checkbox" checked={styles.includes(s.label)} onChange={() => toggle("look", styles, s.label)} />{s.label}</label>))}</div>)}
          {chip("price", "Price", priceOn ? `${usd(pmin)}–${pmax >= RING_PRICE.max ? usd(RING_PRICE.max) + "+" : usd(pmax)}` : "Any", (
            <div className="rf-rgw"><div className="rf-rg">
              <input type="range" min={RING_PRICE.min} max={RING_PRICE.max} step={RING_PRICE.step} value={price[0]} aria-label="Minimum price" onChange={e => commitPrice(Math.min(+e.target.value, price[1] - RING_PRICE.step), price[1])} />
              <input type="range" min={RING_PRICE.min} max={RING_PRICE.max} step={RING_PRICE.step} value={price[1]} aria-label="Maximum price" onChange={e => commitPrice(price[0], Math.max(+e.target.value, price[0] + RING_PRICE.step))} />
              <div className="rf-trk"><i style={{ left: `${((price[0] - RING_PRICE.min) / (RING_PRICE.max - RING_PRICE.min)) * 100}%`, right: `${100 - ((price[1] - RING_PRICE.min) / (RING_PRICE.max - RING_PRICE.min)) * 100}%` }} /></div></div>
              <div className="rf-rv"><span>{usd(price[0])}</span><span>{price[1] >= RING_PRICE.max ? usd(RING_PRICE.max) + "+" : usd(price[1])}</span></div></div>))}
          {tags.length > 0 && <button type="button" className="rf-reset" onClick={reset}>Reset all</button>}
        </div>

        <div className="dres">
          <h2>The collection</h2>
          <label className="dsort">Sort
            <select value={sort} onChange={e => set({ sort: e.target.value === "best" ? null : e.target.value })}>
              <option value="best">Best selling</option><option value="new">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>
        {tags.length > 0 && <div className="rf-tags">{tags.map(t => (
          <button key={t.k + t.v} type="button" className="rf-tag" onClick={() => t.k === "price" ? set({ min: null, max: null }) : set({ [t.k]: (t.k === "style" ? shapes : t.k === "metal" ? metals : styles).filter(x => x !== t.v).join(",") || null })}>{t.l}</button>))}</div>}

        <div className={`pgrid${busy ? " rf-busy" : ""}`} style={{ marginTop: 20 }}>
          {items.map(p => (
            <Link key={p.id} href={`/products/${p.handle}`} className="pcard">
              <div className="pcard-img">{p.image ? <Image src={photoSrc(p.image.url, 700, p.title)} alt={p.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" quality={75} unoptimized={isCleaned(photoSrc(p.image.url, 700, p.title))} /> : <Gem />}</div>
              <div className="pcard-txt"><b>{p.title}</b><span className="price">{usd(p.price, p.currency)}{p.compareAt ? <s className="was">{usd(p.compareAt, p.currency)}</s> : null}</span></div>
            </Link>
          ))}
        </div>
        {!items.length && !busy && <p className="rf-empty">No rings match these filters. Try removing one.</p>}
        {hasNext && <div className="dmore"><button type="button" onClick={more} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
