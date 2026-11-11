"use client";
import { fillPage } from "@/lib/designs";
import DesignCard from "./DesignCard";
import GridMood from "./GridMood";
import Link from "next/link";
import { usePlan, usePlanRoom, DailyTile, PlanBanner } from "./PlanKit";
import { savePlan, clearPlan, planTotal, planOrder, saveFit, usdR } from "@/lib/plan";
import RtsVideoTile from "./RtsVideoTile";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/shopify";
import { RING_METALS, RING_PRICE, RING_SHAPES, RING_STYLES } from "@/lib/ringfilters";
import StoneSwatch from "./StoneSwatch";

const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);
const csv = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
type Pop = "metal" | "shape" | "style" | "price" | "color" | "type" | "plan" | null;
const STONE_COLORS = ["Yellow", "Pink", "Blue", "Green"];

export default function RingsBrowser({ initial, hasNext: h0, cursor: c0, handle = "engagement-rings", fancy, swatches = {}, types = [] }: { initial: Product[]; hasNext: boolean; cursor: string | null; handle?: string; fancy?: string; swatches?: Record<string, string>; types?: string[] }) {
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  const shapes = csv(sp.get("style")), metals = csv(sp.get("metal")), styles = csv(sp.get("look"));
  const sort = sp.get("sort") || "best";
  const type = fancy ? sp.get("type") || "" : "";
  const pmin = Number(sp.get("min")) || RING_PRICE.min, pmax = Number(sp.get("max")) || RING_PRICE.max;
  const key = sp.toString();
  const isDefault = !shapes.length && !metals.length && !styles.length && !type && !sp.get("min") && !sp.get("max") && sort === "best";

  const [items, setItems] = useState<Product[]>(isDefault ? initial : []); // a link with filters in it starts empty and loads its own results
  const [hasNext, setHasNext] = useState(isDefault ? h0 : false);
  const [cursor, setCursor] = useState<string | null>(isDefault ? c0 : null);
  const [busy, setBusy] = useState(!isDefault);
  const [pop, setPop] = useState<Pop>(null);
  const plan = usePlan(); const room = usePlanRoom(); const fitFirst = room?.fit ?? true;
  const [price, setPrice] = useState<[number, number]>([pmin, pmax]);
  const wrap = useRef<HTMLDivElement>(null);

  const api = useCallback((after: string | null) => {
    const q = new URLSearchParams({ handle, sort }); if (fancy) q.set("fancy", fancy); if (type) q.set("type", type);
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
    fillPage([], { cursor: null, hasNext: true }, api).then(r => { if (live && !(r.failed && !r.items.length)) { setItems(r.items); setHasNext(r.hasNext); setCursor(r.cursor); } }).finally(() => live && setBusy(false));
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
  const reset = () => set({ style: null, metal: null, look: null, type: null, min: null, max: null });

  async function more() {
    if (!cursor || busy) return; setBusy(true);
    try { const r = await fillPage(items, { cursor, hasNext }, api); setItems(r.items); setHasNext(r.hasNext); setCursor(r.cursor); } finally { setBusy(false); }
  }
  const priceOn = pmin > RING_PRICE.min || pmax < RING_PRICE.max;
  const tags = useMemo(() => [
    ...(type ? [{ k: "type", v: type, l: type }] : []), ...shapes.map(v => ({ k: "style", v, l: v })), ...metals.map(v => ({ k: "metal", v, l: v })), ...styles.map(v => ({ k: "look", v, l: v })),
    ...(priceOn ? [{ k: "price", v: "", l: `${usd(pmin)} – ${pmax >= RING_PRICE.max ? usd(RING_PRICE.max) + "+" : usd(pmax)}` }] : []),
  ], [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const lab = (a: string[]) => (!a.length ? "Any" : a.length < 3 ? a.join(", ") : `${a.length} selected`);
  const chip = (id: Exclude<Pop, null>, label: string, value: string, body: React.ReactNode) => (
    <div className={`rf-chipw${pop === id ? " open" : ""}`}>
      <button type="button" className={`rf-chip${value !== "Any" ? " act" : ""}`} aria-expanded={pop === id} onClick={() => setPop(pop === id ? null : id)}><small>{label}</small><span>{value}</span></button>
      <div className="rf-pop" role="dialog" aria-label={label}><span className="rf-lbl">{label}</span>{body}</div>
    </div>
  );

  // Your plan (Meekitaz Daily): by what's left after the bag — what fits, the tile, a little more, then the rest
  const ord = room ? planOrder(items, x => +x.price, room.left, room.p) : null;
  const shown = ord ? (room && room.fit ? ord.shown.filter(x => +x.price <= Math.max(0, room.left)) : ord.shown) : items;
  const fitN = room ? items.filter(x => +x.price <= Math.max(0, room.left)).length : 0;
  useEffect(() => { if (room) window.dispatchEvent(new CustomEvent("mk-plan-ctx", { detail: { kind: "cat", fit: fitN } })); }, [fitN, !!room]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="grid-wrap" id={fancy ? "settings" : "results"} aria-label="The collection">
      <div className="wrap" ref={wrap}>
        <div className="rf-bar">
          {fancy && chip("color", "Stone", sp.get("color") || "Any", <div className="rf-sws">{STONE_COLORS.map(c => (
            <button key={c} type="button" className="rf-swl" aria-pressed={sp.get("color") === c} onClick={() => set({ color: sp.get("color") === c ? null : c })}>
              <span className={`rf-sw${sp.get("color") === c ? " on" : ""}`}>{swatches[c] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={swatches[c]} alt="" referrerPolicy="no-referrer" className="rp-sw-img" /> : <i />}</span>{c}</button>))}</div>)}
          {fancy && types.length > 0 && chip("type", "Jewelry", type || "All", <div className="rf-pills">{types.map(t => <button key={t} type="button" className={`rf-pill${type === t ? " on" : ""}`} aria-pressed={type === t} onClick={() => set({ type: type === t ? null : t })}>{t}</button>)}</div>)}
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
          <button key={t.k + t.v} type="button" className="rf-tag" onClick={() => t.k === "price" ? set({ min: null, max: null }) : t.k === "type" ? set({ type: null }) : set({ [t.k]: (t.k === "style" ? shapes : t.k === "metal" ? metals : styles).filter(x => x !== t.v).join(",") || null })}>{t.l}</button>))}</div>}

        {room && <PlanBanner fit={fitN} noun="rings" />}

        <div className={`pgrid${busy ? " rf-busy" : ""}`} style={{ marginTop: 20 }}>
          {shown.map((p, i) => (
            <Fragment key={p.id}>
              {i === 3 && <DailyTile />}
              {/* the mood tile sits after the first two rows (6 on desktop, 4 on a phone: CSS picks the slot) */}
              {handle === "engagement-rings" && i === 4 && items.length > 4 && <GridMood src="/media/rings-mood.mp4" poster="/media/rings-mood-poster.jpg" reveal={{ tag: "Engagement rings", l1: "One stone.", l2: "The whole conversation.", cta: "Shop the look", href: "/products/yellow-gold-cushion-diamond-solitaire-engagement-ring" }} />}
              {/* Fancy Colors: the walking film (yellow cushion on her hand), same opening as the necklaces; the crop keeps the hand in view */}
              {handle === "fancy-colors" && i === 4 && items.length > 4 && <GridMood src="/media/fancy-mood.mp4" poster="/media/fancy-mood-poster.jpg" pos="62% 92%" reveal={{ tag: "Fancy colors", l1: "Pack light.", l2: "Wear the yellow.", cta: "Shop the look", href: "/products/yellow-gold-fancy-yellow-cushion-cut-diamond-classic-solitaire-engagement-ring" }} />}
              {/* Fancy Colors: the yellow-headscarf photo, two rows after the film (four rows in), the same tile as the One of One page */}
              {/* Engagement rings: two rows after the film, the pink-halo portrait → Fancy Colors; two rows after that, the lipstick portrait → One of One */}
              {handle === "engagement-rings" && i === 10 && items.length > 10 && (
                <div className="pgrid-slot"><Link href="/fancy-colors?type=Rings#settings" className="op-tile op-link"><img src="/media/rings-fancy-tile.webp" alt="A fancy pink oval diamond ring with a halo, worn against oxblood silk" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 40%" }} /><span className="op-cap"><small>Fancy colors</small><b>Explore fancy &rarr;</b></span></Link></div>
              )}
              {handle === "engagement-rings" && i === 20 && items.length > 20 && (
                <div className="pgrid-slot"><Link href="/one-of-one" className="op-tile op-link"><img src="/media/rings-ooo-tile.webp" alt="Laughing in red sunglasses, lipstick in hand, a one-of-one elongated hexagon diamond ring on her finger" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }} /><span className="op-cap"><small>One of One</small><b>Made once.<br />Never again. &rarr;</b></span></Link></div>
              )}
              {/* Engagement rings: two rows after the One of One tile, a tall "shop the style" photo → the oval hidden-halo pavé ring */}
              {handle === "engagement-rings" && i === 30 && items.length > 30 && (
                <div className="pgrid-slot"><Link href="/products/white-gold-oval-diamond-hidden-halo-engagement-ring-with-pave-band" className="op-tile op-link op-tall"><img src="/media/rings-style-tile.webp" alt="A hand on oxblood tailored trousers wearing an oval diamond engagement ring with a hidden halo and pavé band" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 55%" }} /><span className="op-cap"><small>The oval, hidden halo</small><b>Shop the style &rarr;</b></span></Link></div>
              )}
              {/* Engagement rings: further down, a Ready-to-Ship film → the in-stock rings */}
              {handle === "engagement-rings" && i === 40 && items.length > 40 && <RtsVideoTile />}
              {/* Engagement rings: two rows after the Ready-to-Ship film, a tall "shop the style" photo → the three-stone pear ring */}
              {handle === "engagement-rings" && i === 46 && items.length > 46 && (
                <div className="pgrid-slot"><Link href="/products/white-gold-three-stone-pear-diamond-ring-with-pear-side-stones" className="op-tile op-link op-tall"><img src="/media/rings-pear-style-tile.webp" alt="Smiling in champagne sunglasses, a three-stone pear diamond engagement ring with pear side stones on her finger" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }} /><span className="op-cap"><small>The three-stone pear</small><b>Shop the style &rarr;</b></span></Link></div>
              )}
              {handle === "fancy-colors" && i === 10 && items.length > 10 && (
                <div className="pgrid-slot"><div className="op-tile"><img src="/media/fancy-yellow-tile.jpg" alt="Hand over her mouth in a yellow headscarf and oval sunglasses, a fancy yellow cushion diamond ring on her finger" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 55%" }} /><div className="op-cap"><small>Fancy yellow</small><b>Say less.<br />Wear yellow.</b></div></div></div>
              )}
              {/* Fancy Colors: the oxblood-silk portrait with the pink oval halo ring, four rows after the yellow photo — the same tile */}
              {handle === "fancy-colors" && i === 22 && items.length > 22 && (
                <div className="pgrid-slot"><div className="op-tile"><img src="/media/fancy-pink-tile.webp" alt="Hand against her cheek in oxblood silk, a fancy pink oval diamond ring with a diamond halo on her finger" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 40%" }} /><div className="op-cap"><small>Fancy pink</small><b>Pink is<br />a neutral.</b></div></div></div>
              )}
              <DesignCard p={p} from={!fancy} />
            </Fragment>
          ))}
        </div>
        {!items.length && !busy && <p className="rf-empty">No rings match these filters. Try removing one.</p>}
        {hasNext && <div className="dmore"><button type="button" onClick={more} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
