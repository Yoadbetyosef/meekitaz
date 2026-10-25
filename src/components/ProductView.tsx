"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import LoopFilm from "@/components/LoopFilm";
import StoneImg from "./StoneImg";
import RingSteps from "./RingSteps";
import ImmersiveHero from "./ImmersiveHero";
import { PRODUCT_VIDEOS } from "@/lib/productVideos";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "./CartProvider";
import { ringMetalOf, type ProductFull, type Related, type Sibling } from "@/lib/shopify";
import { metalOf } from "@/lib/shopify";
import type { RingVariant } from "@/lib/shopify";
import { saveSetting, diamondsUrl, loadStone } from "@/lib/setting";
import { fancyColorOf } from "@/lib/fancy";
import { METAL_LINE } from "@/lib/designs";
import { addonFor, completeSel, optionRows, type ProductOptions, type Sel } from "@/lib/options";
import StoneSwatch from "./StoneSwatch";
import { GOLD_COLORS, hasKarat, isGoldMetal, karatsFor, karatStep } from "@/lib/karat";
import { toast } from "./Toast";
import { photoSrc, isCleaned } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SW: Record<string, string> = { "Rose Gold": "#E3AE98", "Yellow Gold": "#E6C56B", "White Gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB", "Rose gold": "#E3AE98", "Yellow gold": "#E6C56B", "White gold": "#E8E8EA" };
const RING_METALS = ["Silver", "Platinum", "White gold", "Yellow gold", "Rose gold"];
const nm = (m: string) => { const l = m.toLowerCase(); return l.startsWith("rose") ? "Rose gold" : l.startsWith("yellow") ? "Yellow gold" : l.startsWith("white") ? "White gold" : l.startsWith("plat") ? "Platinum" : l.startsWith("silver") ? "Silver" : m; };
const FACTS: Record<string, string> = {
  Silver: "92.5% pure silver. Everyday value; can tarnish and needs polishing.",
  "10K": "41.7% gold. The most durable gold, with a slightly paler tone.",
  "14K": "58.3% gold. The classic balance of colour and strength.",
  "18K": "75% gold. The richest colour; a little softer.",
  Platinum: "95% pure platinum. Naturally white, dense and long-wearing.",
};
/** The approved two-step picker: Silver · 10K · 14K · 18K · Platinum, then the colour (dimmed for silver and platinum). The karat prices come from our price list. */
function Material({ ns, metals, metal, karat, onMetal, onKarat, karats, steps }: { ns: string; metals: string[]; metal: string; karat: string; onMetal: (m: string) => void; onKarat: (k: string) => void; karats?: string[]; steps?: Record<string, number> }) {
  const golds = GOLD_COLORS.filter(g => metals.includes(g)), ks = golds.length ? (karats || karatsFor(ns)) : [];
  const gold = isGoldMetal(metal);
  const items: { id: string; on: boolean; go: () => void }[] = [
    ...(metals.includes("Silver") ? [{ id: "Silver", on: metal === "Silver", go: () => onMetal("Silver") }] : []),
    ...ks.map(k => ({ id: k, on: gold && karat === k, go: () => onKarat(k) })),
    ...(metals.includes("Platinum") ? [{ id: "Platinum", on: metal === "Platinum", go: () => onMetal("Platinum") }] : []),
  ];
  const picked = metal === "Silver" ? "Silver" : metal === "Platinum" ? "Platinum" : karat;
  return (
    <>
      <div className="mk-lbl">Metal <em>{gold ? `${karat} ${metal}` : metal}</em></div>
      <div className="mk-seg" style={{ gridTemplateColumns: `repeat(${items.length},1fr)` }}>{items.map(i => (
        <button key={i.id} type="button" className={i.on ? "on" : ""} aria-pressed={i.on} onClick={i.go}>{i.id}{steps && steps[i.id] ? <small>+{usd(steps[i.id])}</small> : null}</button>))}</div>
      <div className="mk-lbl">Colour <em>{gold ? metal : "Natural white"}</em></div>
      <div className="mk-cols">{golds.map(g => (
        <button key={g} type="button" title={g} className={`mk-col${gold && metal === g ? " on" : ""}${gold ? "" : " off"}`} aria-pressed={gold && metal === g} disabled={!gold} onClick={() => onMetal(g)}>
          <span style={{ "--lc": METAL_LINE[g] } as CSSProperties} />{g.replace(" gold", "")}</button>))}</div>
      <p className="mk-hint">{FACTS[picked]}</p>
    </>
  );
}
export type RingProp = { family: RingVariant[]; shapes: { img: string; label: string }[]; ns: string; color?: string; palette?: { color: string; items: { handle: string; shape: string; metal: string }[] }[]; swatches?: Record<string, string> };
const Ic = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const TRUST = [
  ["M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7zM8.5 12l2.5 2.5L15.5 10", "IGI / GIA certified diamonds"],
  ["M4 8h12a4 4 0 010 8H8M7 5L4 8l3 3", "30-day free returns"],
  ["M12 12c2-3 5-4 6-2s-1 5-4 4l-4-2c-3-1-5 0-5 2s3 3 6 0z", "Lifetime warranty"],
  ["M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 17.5h.01M17 17.5h.01", "Free insured shipping"],
];

/** The Meekitaz box on a transparent background, so it sits on any page colour with no rectangle around it. */
const BOX_IMG = "/media/meekitaz-box.webp";

export default function ProductView({ product: p, siblings, related, ring, options }: { product: ProductFull; siblings: Sibling[]; related: Related[]; ring?: RingProp; options?: ProductOptions | null }) {
  const { add, busy, addRing, addConfigured, addCare } = useCart();
  const [care, setCare] = useState<"" | "3y" | "life">("");
  // pieces with an option tree (weight / colour / clarity / purity / extras): the picks, with defaults filled in
  const qp = useSearchParams();
  const [rawSel, setRawSel] = useState<Sel>(() => { const k = qp.get("k"); const init: Sel = {}; if (k) init["Gold Purity"] = k; return init; });
  const osel = useMemo(() => (options ? completeSel(options, rawSel) : {}), [options, rawSel]);
  const rows = useMemo(() => (options ? optionRows(options, osel) : []), [options, osel]);
  const addon = options ? addonFor(options, osel) : 0;
  const hasOpts = rows.length > 0;
  const router = useRouter();
  const [rh, setRh] = useState(p.handle);
  const ns = ring?.ns || p.tags.find(t => /^NS-\d+$/.test(t)) || "";
  const karatOn = hasKarat(ns) && !hasOpts; // the option tree carries its own Gold Purity prices
  const [karatPick, setKarat] = useState("10K");
  useEffect(() => { try { const k = sessionStorage.getItem("mk_karat"); if (k === "14K" || k === "18K") setKarat(k); } catch { /* ignore */ } }, []);
  const pickKarat = (k: string) => { setKarat(k); try { sessionStorage.setItem("mk_karat", k); } catch { /* ignore */ } };
  const cv = ring?.family.find(v => v.handle === rh) ?? null; // the ring design in the shape and metal chosen on this page
  const real = p.options.filter(o => !(o.values.length === 1 && o.values[0] === "Default Title") && o.name !== "Title");
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries((p.variants[0]?.selected || []).map(s => [s.name, s.value])));
  const variant = useMemo(() => p.variants.find(v => v.selected.every(s => sel[s.name] === s.value)) || p.variants[0], [p, sel]);
  const [heroOn, setHeroOn] = useState(true);
  const metal = metalOf(p.tags) || ringMetalOf(p.title);
  const save = variant.compareAt ? variant.compareAt - variant.price : 0;
  const details = p.tags.filter(t => !/gold|silver|platinum|rose|yellow|white|^NS-|^CBR$|express|normal_side|^RJ-/i.test(t)).slice(0, 4);
  const base = cv ? cv.images.map(u => ({ url: u, alt: cv.title, width: 1000, height: 1000 })) : p.images;
  // the on-model photo sits second in the gallery, after the product shot
  // the worn photo belongs to the shape and metal chosen here (a ring in another shape shows its own, never the old shape's)
  const worn = cv ? cv.modelImage : p.modelImage;
  const imgs = worn && base.length ? [base[0], { url: worn, alt: `${cv ? cv.title : p.title} worn`, width: 1000, height: 1250 }, ...base.slice(1)] : base;
  const metalNow = nm(cv ? cv.metal : metal || "");
  const karat = karatsFor(ns).includes(karatPick as "10K") ? karatPick : "10K"; // a design only offers the karats of its price list
  const step = karatOn && isGoldMetal(metalNow) ? karatStep(ns, karat) : 0;
  const kLabel = karatOn && isGoldMetal(metalNow) ? karat : "";
  const baseP = cv ? cv.price : variant.price, baseC = cv ? cv.compareAt : variant.compareAt;
  const title = cv ? cv.title : p.title, price = baseP + step + addon, compareAt = baseC > 0 ? baseC + 2 * step + 2 * addon : 0;
  const shapesHere = ring ? ring.shapes.filter(s => ring.family.some(v => v.shape === s.label)) : [];
  const metalsHere = cv && ring ? RING_METALS.filter(m => ring.family.some(v => v.shape === cv.shape && v.metal === m)) : [];
  const pickRing = (shape: string, metal: string) => {
    const next = ring?.family.find(v => v.shape === shape && v.metal === metal) || ring?.family.find(v => v.shape === shape);
    if (!next) return; setRh(next.handle);
    window.history.replaceState(null, "", `/products/${next.handle}`);
  };
  const chooseSetting = () => {
    if (!cv || !ring) return;
    const stone = loadStone();
    // a diamond is already chosen: the setting follows the diamond's shape
    let pick = cv;
    if (stone && stone.shape !== cv.shape) {
      const alt = ring.family.find(v => v.shape === stone.shape && v.metal === cv.metal) || ring.family.find(v => v.shape === stone.shape);
      if (!alt) { toast(`This setting is not made in ${stone.shape.toLowerCase()}. Pick another setting for your ${stone.shape.toLowerCase()} diamond.`); return; }
      pick = alt;
    }
    const pk = karatOn && isGoldMetal(pick.metal) ? karat : "";
    const fc = fancyColorOf(pick.title) || undefined;
    const setting = { ns: ring.ns, handle: pick.handle, variantId: pick.variantId, title: pick.title, shape: pick.shape, metal: pick.metal, price: pick.price + (pk ? karatStep(ring.ns, pk) : 0), image: pick.images[0] || "", karat: pk || undefined, color: fc };
    saveSetting(setting);
    if (!stone) { router.push(diamondsUrl(pick.shape, fc)); return; }
    // a diamond is already chosen: review the pair first (diamond + setting), not straight into the bag
    router.push(`/diamonds/${stone.vendor}-${encodeURIComponent(stone.stock)}`);
  };

  const heroTitle = (t: string) => t.replace(/^(yellow gold|white gold|rose gold|silver|platinum)\s+/i, "").replace(/^\d+K\s+/i, "");
  const hasMetal = Boolean((ring && cv) || (!ring && ((karatOn && siblings.length > 0) || (hasOpts && siblings.length > 0) || (!karatOn && !hasOpts && siblings.length > 1))));
  const metalWord = nm(metalNow || "").replace(/\s*gold$/i, "");
  const purity = hasOpts ? (osel["Gold Purity"] || "") : kLabel;
  const summary = [[purity, metalWord].filter(Boolean).join(" "), ...(ring && cv ? [cv.shape, ...(ring.color ? [`${ring.color} diamond`] : [])] : []) /* an engagement ring is the setting only: the diamond is chosen in step 2, so a colour is named only on the fancy-colour designs */, ...(hasOpts ? rows.filter(r => r.name !== "Gold Purity").map(r => String(osel[r.name] || "").replace(/ Carat$/i, " ct")) : []), ...real.map(o => sel[o.name] || "")].filter(Boolean);
  const priceNode = <div className="pp-price"><b>{usd(price)}</b>{compareAt > 0 && <><s>{usd(compareAt)}</s><i>{ring ? "Setting only" : `Save ${usd(compareAt - price)}`}</i></>}</div>;
  // the metal (and its colour) sit apart from the other choices: on a phone they are the slim bar at the top
  const metalNode = (
    <>
      {ring && cv && (
        <>
                {karatOn ? (
                  <Material ns={ns} metals={metalsHere} metal={cv.metal} karat={karat} onMetal={m => pickRing(cv.shape, m)}
                    onKarat={k => { pickKarat(k); if (!isGoldMetal(cv.metal)) pickRing(cv.shape, GOLD_COLORS.find(g => metalsHere.includes(g)) || cv.metal); }} />
                ) : (<>
                  <span className="pp-lbl">Metal · {cv.metal}</span>
                  <div className="rp-metals">{metalsHere.map(m => (
                    <button key={m} type="button" className={`rp-mt${cv.metal === m ? " on" : ""}`} aria-pressed={cv.metal === m} onClick={() => pickRing(cv.shape, m)}>
                      <span className="rp-sw"><i style={{ background: SW[m] || "#ddd" }} /></span>{m.replace(" gold", "")}</button>))}</div>
                </>)}
        </>
      )}
            {!ring && karatOn && siblings.length > 0 && (
              <Material ns={ns} metals={siblings.map(s => nm(s.metal))} metal={metalNow} karat={karat}
                onMetal={m => { const t = siblings.find(s => nm(s.metal) === m); if (t && t.handle !== p.handle) router.replace(`/products/${t.handle}`, { scroll: false }); }}
                onKarat={k => { pickKarat(k); if (!isGoldMetal(metalNow)) { const t = siblings.find(s => isGoldMetal(nm(s.metal))); if (t) router.replace(`/products/${t.handle}`, { scroll: false }); } }} />
            )}
            {!ring && hasOpts && siblings.length > 0 && (() => {
              const gp = rows.find(r => r.name === "Gold Purity");
              const steps = Object.fromEntries((gp?.values || []).map(v => [v.label, v.price]));
              const metalsHere = [...new Set(siblings.map(s => ringMetalOf(s.title) || nm(s.metal)).filter(Boolean))];
              const mine = ringMetalOf(p.title) || nm(metal);
              const goTo = (m: string, k?: string) => { const t = siblings.find(s => (ringMetalOf(s.title) || nm(s.metal)) === m); if (t && t.handle !== p.handle) router.replace(`/products/${t.handle}${k ? `?k=${encodeURIComponent(k)}` : ""}`, { scroll: false }); };
              // on a silver or platinum page the gold karats are still offered (prices come once a gold colour is chosen)
              const karats = gp ? gp.values.map(v => v.label) : (GOLD_COLORS.some(c => metalsHere.includes(c)) ? ["10K", "14K", "18K"] : []);
              return <Material ns={ns} metals={metalsHere} metal={mine} karat={osel["Gold Purity"] || gp?.values[0]?.label || ""} karats={karats} steps={steps}
                onMetal={goTo} onKarat={k => { setRawSel(x => ({ ...x, "Gold Purity": k })); if (!isGoldMetal(mine)) { const g = GOLD_COLORS.find(c => metalsHere.includes(c)); if (g) goTo(g, k); } }} />;
            })()}
            {!ring && !karatOn && !hasOpts && siblings.length > 1 && (
              <>
                <span className="pp-lbl">Metal · <em>{nm(metal || p.title)}</em></span>
                <div className="rp-metals">
                  {siblings.map(s => { const m = nm(s.metal); const on = s.handle === p.handle; return (
                    <Link key={s.handle} href={`/products/${s.handle}`} aria-label={m} className={`rp-mt${on ? " on" : ""}`} aria-pressed={on} replace scroll={false}>
                      <span className="rp-sw"><i style={{ background: SW[m] || "#ddd" }} /></span>{m.replace(" gold", "")}</Link>); })}
                </div>
              </>
            )}
    </>
  );
  const rowsNode = (
    <>
      {ring && cv && (
        <>
                {(ring.palette?.length ?? 0) > 0 && (<>
                  <span className="pp-lbl">Stone colour · {ring.color || "White"}</span>
                  <div className="rp-colors">
                    {[{ color: ring.color || "", items: [] as { handle: string; shape: string; metal: string }[] }, ...(ring.palette || [])].map(pc => {
                      const on = pc.color === (ring.color || "");
                      const hit = on ? null : pc.items.find(v => v.shape === cv.shape && v.metal === cv.metal) || pc.items.find(v => v.shape === cv.shape) || pc.items[0];
                      return (
                        <button key={pc.color || "white"} type="button" className={`rp-mt${on ? " on" : ""}`} aria-pressed={on} disabled={!on && !hit} onClick={() => hit && router.push(`/products/${hit.handle}`)}>
                          <StoneSwatch color={pc.color} src={ring.swatches?.[pc.color]} />{pc.color || "White"}</button>);
                    })}
                  </div>
                </>)}
                <span className="pp-lbl">Shape · {cv.shape}</span>
                <div className="rp-shapes">{shapesHere.map(sh => (
                  <button key={sh.label} type="button" className={`rp-sh${cv.shape === sh.label ? " on" : ""}`} aria-pressed={cv.shape === sh.label} onClick={() => pickRing(sh.label, cv.metal)}>
                    <i><StoneImg img={sh.img} alt="" base={64} quality={70} /></i><b>{sh.label}</b></button>))}</div>
        </>
      )}
            {hasOpts && rows.filter(r => r.name !== "Gold Purity").map(r => (
              <div key={r.name} className="po-row">
                <span className="pp-lbl">{r.name} · <em>{osel[r.name]}</em></span>
                <div className={`po-vals${/weight/i.test(r.name) && r.values.length > 5 ? " wt" : r.values.length <= 4 ? " seg" : ""}`}>{r.values.map(v => {
                  const on = osel[r.name] === v.label;
                  const diff = v.price - (r.values.find(x => x.label === osel[r.name])?.price || 0);
                  return <button key={v.label} type="button" className={`po-v${on ? " on" : ""}`} aria-pressed={on} onClick={() => setRawSel(x => ({ ...x, [r.name]: v.label }))}>{v.label.replace(/ Carat$/i, " ct")}{!on && diff !== 0 && <small>{diff > 0 ? "+" : "−"}{usd(Math.abs(diff))}</small>}</button>;
                })}</div>
                {/weight/i.test(r.name) && r.values.length > 5 && (() => {
                  const idx = Math.max(0, r.values.findIndex(x => x.label === osel[r.name])), L = (x: string) => x.replace(/ Carat$/i, " ct");
                  return (
                    <div className="po-rng">
                      <div className="po-big">{L(r.values[idx].label)}</div>
                      <input type="range" min={0} max={r.values.length - 1} step={1} value={idx} aria-label={r.name} aria-valuetext={L(r.values[idx].label)} onChange={e => { const v = r.values[+e.target.value]; setRawSel(x => ({ ...x, [r.name]: v.label })); }} />
                      <div className="tk">{[0, .25, .5, .75, 1].map(f => { const k = Math.round(f * (r.values.length - 1)); return <span key={k}>{L(r.values[k].label)}</span>; })}</div>
                    </div>
                  );
                })()}
              </div>
            ))}
            {real.map(o => (
              <div key={o.name}>
                <span className="pp-lbl">{o.name} · {sel[o.name]}</span>
                <div className="pp-pills">{o.values.map(val => <button key={val} type="button" className={sel[o.name] === val ? "on" : ""} onClick={() => setSel({ ...sel, [o.name]: val })}>{val}</button>)}</div>
              </div>
            ))}
            {!(ring && cv) && p.productType !== "Care Package" && (
              <div className="pp-care">
                <span className="pp-lbl">Care package<a href="/warranty" target="_blank" rel="noopener">What’s covered?</a></span>
                {([["", "Manufacturer Warranty", "Included · lifetime, defects + 1 free resize", "Free"], ["3y", "3-Year Care", "Resizing, cleanings, re-plating, stone re-setting", "+$250"], ["life", "Lifetime Care", "Everything, for life + lost side stones", "+$390"]] as const).map(([k, t, d, pr]) => (
                  <button key={k} type="button" className={`pp-copt${care === k ? " on" : ""}`} onClick={() => setCare(k)} aria-pressed={care === k}>
                    <i /><span><b>{t}{k === "life" && <em>Best value</em>}</b><small>{d}</small></span><strong>{pr}</strong>
                  </button>
                ))}
              </div>
            )}
    </>
  );
  const ctaNode = ring && cv ? (
    <button type="button" className="pp-add" onClick={chooseSetting}>Choose this setting<small>Next: pick your {cv.shape.toLowerCase()} diamond</small></button>
  ) : (
    <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={async () => { const r = hasOpts ? await addConfigured(variant.id, p.handle, osel) : await add(variant.id, 1, step ? karat : ""); if (r.ok && care) await addCare(care, [title, variant.title !== "Default Title" ? variant.title : "", step ? karat : ""].filter(Boolean).join(" · ")); if (!r.ok) toast(r.error === "not_configured" ? "This option is being connected for checkout. Please book an appointment and we will complete it with you." : "We could not add this to your bag. Please try again."); }}>{!variant.available ? "Sold out" : busy ? "Adding…" : `Add to bag · ${usd(price + (care === "3y" ? 250 : care === "life" ? 390 : 0))}`}</button>
  );
  const apptNode = <Link href="/#contact" className="pp-appt">Book a private appointment</Link>;

  return (
    <main className="pp ih-on">
      <ImmersiveHero boxPic={{ src: BOX_IMG, alt: "Meekitaz presentation box with velvet ring box and certificate drawer" }} title={title} bigTitle={heroTitle(title)} images={imgs} model={worn || undefined} stone={ring?.color || ""} stoneShape={ring && cv ? cv.shape : undefined} film={ring ? { src: "/media/rings-film.mp4", poster: "/media/rings-film-poster.jpg", srcD: "/media/rings-film-desktop.mp4", posterD: "/media/rings-film-desktop-poster.jpg" } : p.productType === "Earrings" ? { src: "/media/earrings-film.mp4", poster: "/media/earrings-film-poster.jpg", srcD: "/media/earrings-film-desktop.mp4", posterD: "/media/earrings-film-desktop-poster.jpg" } : /\bbands?\b/i.test(p.productType || "") ? { src: "/media/bands-film.mp4", poster: "/media/bands-film-poster.jpg", srcD: "/media/bands-film-desktop.mp4", posterD: "/media/bands-film-desktop-poster.jpg" } : /^necklaces?$/i.test(p.productType || "") ? { src: "/media/necklaces-film.mp4", poster: "/media/necklaces-film-poster.jpg", srcD: "/media/necklaces-film-desktop.mp4", posterD: "/media/necklaces-film-desktop-poster.jpg" } : /^bracelets?$/i.test(p.productType || "") ? { src: "/media/bracelets-film.mp4", poster: "/media/bracelets-film-poster.jpg", srcD: "/media/bracelets-film-desktop.mp4", posterD: "/media/bracelets-film-desktop-poster.jpg" } : undefined} clip={PRODUCT_VIDEOS[ns] ?? (p.videoUrl ? { src: p.videoUrl, poster: worn || base[0]?.url || "" } : undefined)}
        steps={ring ? <RingSteps step={1} onDiamond={cv ? chooseSetting : undefined} /> : null}
        summary={summary}
        price={priceNode} metal={hasMetal ? metalNode : null} rows={rowsNode} cta={ctaNode} appt={apptNode} onVisible={setHeroOn} />
      <div className="wrap">
        <section className="pp-below">
          <div>
            {!ring && <p className="pp-crumb"><Link href="/">Home</Link> / {p.productType || "Shop"}{metal ? ` / ${metal}` : ""}</p>}
            <h2>Serious diamonds, worn lightly.</h2>
            <div className="pp-acc">
              <details open><summary>Description</summary><div className="pp-desc" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} /></details>
              <details><summary>Details</summary><ul><li>Lab-grown diamonds, independently certified</li>{metal && <li>Metal: {metal}</li>}{details.map(t => <li key={t}>{t}</li>)}</ul></details>
              <details><summary>Shipping &amp; returns</summary><p>Free insured shipping. Returns within 30 days. Every piece arrives in a Meekitaz box with its certificate.</p></details>
              <details><summary>Care</summary><p>Store separately, avoid harsh chemicals, and clean with warm water and a soft brush. Complimentary cleaning for life at our showroom.</p></details>
            </div>
          </div>
          <div className="pp-trust">{TRUST.map(([d, t]) => <div key={t}><Ic d={d} />{t}</div>)}</div>
        </section>

        <section className="pp-film" aria-label="How your piece arrives">
          <div className="pf-in">
            <div className="pf-st" aria-hidden="true">
              <svg viewBox="0 0 100 100"><defs><path id="pfring" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" /></defs><text><textPath href="#pfring" textLength="250" lengthAdjust="spacing">OPEN ME · OPEN ME · OPEN ME · OPEN ME ·</textPath></text></svg>
              <i className="mkm" />
            </div>
            <div className="pf-vid"><LoopFilm src="/media/unboxing.mp4" poster="/media/unboxing-poster.jpg" label="Our pink box opening, with a ring, a pouch and sunglasses laid out beside it" /></div>
            <div className="pf-tx">
              <div><small className="eyebrow">How it arrives</small><h2>Small box. Big feelings.</h2></div>
              <p>Every piece comes gift-ready in our signature pink box. Open it slowly.</p>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="pp-look">
            <small className="eyebrow">Complete the look</small><h2>You may also like</h2>
            <div className="pp-lk">
              {related.map(r => (
                <Link key={r.handle} href={`/products/${r.handle}`}>
                  <div className="im">{r.image && <Image src={photoSrc(r.image, 500, r.title)} alt={r.title} fill sizes="(max-width:767px) 50vw, 280px" quality={70} unoptimized={isCleaned(photoSrc(r.image, 500, r.title))} />}</div>
                  <b>{r.title.length > 52 ? r.title.slice(0, 50) + "…" : r.title}</b>
                  <span>{usd(r.price)}{r.compareAt > 0 && <s>{usd(r.compareAt)}</s>}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {!heroOn && (
        <div className="pp-sbar">
        <div><b>{usd(price)}</b>{compareAt > 0 && <s>{usd(compareAt)}</s>}</div>
        {ring && cv ? <button type="button" className="pp-add" onClick={chooseSetting}>Choose this setting</button> : <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={async () => { const r = await (hasOpts ? addConfigured(variant.id, p.handle, osel) : add(variant.id)); if (r.ok && care) await addCare(care, [title, variant.title !== "Default Title" ? variant.title : ""].filter(Boolean).join(" · ")); }}>{variant.available ? `Add to bag · ${usd(price)}` : "Sold out"}</button>}
      </div>
      )}
    </main>
  );
}
