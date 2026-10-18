"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import type { ProductFull, Related, Sibling } from "@/lib/shopify";
import { metalOf } from "@/lib/shopify";
import type { RingVariant } from "@/lib/shopify";
import { saveSetting, diamondsUrl } from "@/lib/setting";
import { photoSrc, isCleaned } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SW: Record<string, string> = { "Rose Gold": "#E3AE98", "Yellow Gold": "#E6C56B", "White Gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB", "Rose gold": "#E3AE98", "Yellow gold": "#E6C56B", "White gold": "#E8E8EA" };
const RING_METALS = ["Silver", "Platinum", "White gold", "Yellow gold", "Rose gold"];
export type RingProp = { family: RingVariant[]; shapes: { img: string; label: string }[]; ns: string };
const Ic = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const TRUST = [
  ["M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7zM8.5 12l2.5 2.5L15.5 10", "IGI / GIA certified diamonds"],
  ["M4 8h12a4 4 0 010 8H8M7 5L4 8l3 3", "30-day free returns"],
  ["M12 12c2-3 5-4 6-2s-1 5-4 4l-4-2c-3-1-5 0-5 2s3 3 6 0z", "Lifetime warranty"],
  ["M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 17.5h.01M17 17.5h.01", "Free insured shipping"],
];

export default function ProductView({ product: p, siblings, related, ring }: { product: ProductFull; siblings: Sibling[]; related: Related[]; ring?: RingProp }) {
  const { add, busy } = useCart();
  const router = useRouter();
  const [rh, setRh] = useState(p.handle);
  const cv = ring?.family.find(v => v.handle === rh) ?? null; // the ring design in the shape and metal chosen on this page
  const real = p.options.filter(o => !(o.values.length === 1 && o.values[0] === "Default Title") && o.name !== "Title");
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries((p.variants[0]?.selected || []).map(s => [s.name, s.value])));
  const variant = useMemo(() => p.variants.find(v => v.selected.every(s => sel[s.name] === s.value)) || p.variants[0], [p, sel]);
  const [slide, setSlide] = useState(0);
  const car = useRef<HTMLDivElement>(null);
  const metal = metalOf(p.tags);
  const save = variant.compareAt ? variant.compareAt - variant.price : 0;
  const details = p.tags.filter(t => !/gold|silver|platinum|rose|yellow|white|^NS-|^CBR$|express|normal_side|^RJ-/i.test(t)).slice(0, 4);
  const imgs = cv ? cv.images.map(u => ({ url: u, alt: cv.title, width: 1000, height: 1000 })) : p.images;
  const title = cv ? cv.title : p.title, price = cv ? cv.price : variant.price, compareAt = cv ? cv.compareAt : variant.compareAt;
  const shapesHere = ring ? ring.shapes.filter(s => ring.family.some(v => v.shape === s.label)) : [];
  const metalsHere = cv && ring ? RING_METALS.filter(m => ring.family.some(v => v.shape === cv.shape && v.metal === m)) : [];
  const pickRing = (shape: string, metal: string) => {
    const next = ring?.family.find(v => v.shape === shape && v.metal === metal) || ring?.family.find(v => v.shape === shape);
    if (!next) return; setRh(next.handle); setSlide(0); car.current?.scrollTo({ left: 0 });
    window.history.replaceState(null, "", `/products/${next.handle}`);
  };
  const chooseSetting = () => {
    if (!cv || !ring) return;
    saveSetting({ ns: ring.ns, handle: cv.handle, variantId: cv.variantId, title: cv.title, shape: cv.shape, metal: cv.metal, price: cv.price, image: cv.images[0] || "" });
    router.push(diamondsUrl(cv.shape));
  };

  return (
    <main className="pp">
      <div className="wrap">
        <p className="pp-crumb"><Link href="/">Home</Link> / {p.productType || "Shop"}{metal ? ` / ${metal}` : ""}</p>
        <div className="pp-grid">
          {/* desktop: stacked gallery */}
          <div className="pp-gal">
            {imgs.map((im, i) => (
              <figure key={im.url} className={i === 0 ? "first" : ""}>
                <Image src={photoSrc(im.url, 1100, title, i)} alt={im.alt} fill sizes="(max-width:1100px) 50vw, 620px" quality={78} priority={i === 0} unoptimized={isCleaned(photoSrc(im.url, 1100, title, i))} />
              </figure>
            ))}
          </div>
          {/* phone: swipe */}
          <div className="pp-carw">
            <div className="pp-car" ref={car} onScroll={() => car.current && setSlide(Math.round(car.current.scrollLeft / car.current.clientWidth))}>
              {imgs.map((im, i) => <figure key={im.url}><Image src={photoSrc(im.url, 900, title, i)} alt={im.alt} fill sizes="100vw" quality={75} priority={i === 0} unoptimized={isCleaned(photoSrc(im.url, 900, title, i))} /></figure>)}
            </div>
            {imgs.length > 1 && <span className="pp-cnt">{slide + 1} / {imgs.length}</span>}
          </div>

          <div className="pp-info">
            <small className="eyebrow">Lab-grown · IGI certified</small>
            <h1>{title}</h1>
            <div className="pp-price"><b>{usd(price)}</b>{compareAt > 0 && <><s>{usd(compareAt)}</s><i>{ring ? "Setting only" : `Save ${usd(compareAt - price)}`}</i></>}</div>
            <p className="pp-sub">{ring ? "Choose the setting first. Next, pick your diamond." : "Serious diamonds, worn lightly."}</p>

            {ring && cv && (
              <>
                <span className="pp-lbl">Shape · {cv.shape}</span>
                <div className="rp-shapes">{shapesHere.map(sh => (
                  <button key={sh.label} type="button" className={`rp-sh${cv.shape === sh.label ? " on" : ""}`} aria-pressed={cv.shape === sh.label} onClick={() => pickRing(sh.label, cv.metal)}>
                    <i><Image src={sh.img} alt="" fill sizes="64px" quality={60} /></i><b>{sh.label}</b></button>))}</div>
                <span className="pp-lbl">Metal · {cv.metal}</span>
                <div className="rp-metals">{metalsHere.map(m => (
                  <button key={m} type="button" className={`rp-mt${cv.metal === m ? " on" : ""}`} aria-pressed={cv.metal === m} onClick={() => pickRing(cv.shape, m)}>
                    <span className="rp-sw"><i style={{ background: SW[m] || "#ddd" }} /></span>{m.replace(" gold", "")}</button>))}</div>
              </>
            )}

            {!ring && siblings.length > 1 && (
              <>
                <span className="pp-lbl">Metal{metal ? ` · ${metal}` : ""}</span>
                <div className="pp-sw">
                  {siblings.map(s => (
                    <Link key={s.handle} href={`/products/${s.handle}`} aria-label={s.metal} className={s.handle === p.handle ? "on" : ""} replace scroll={false}><i style={{ background: SW[s.metal] || "#ddd" }} /></Link>
                  ))}
                </div>
              </>
            )}

            {real.map(o => (
              <div key={o.name}>
                <span className="pp-lbl">{o.name} · {sel[o.name]}</span>
                <div className="pp-pills">{o.values.map(val => <button key={val} type="button" className={sel[o.name] === val ? "on" : ""} onClick={() => setSel({ ...sel, [o.name]: val })}>{val}</button>)}</div>
              </div>
            ))}

            <div className="pp-cta">
              {ring && cv ? (
                <button type="button" className="pp-add" onClick={chooseSetting}>Choose this setting<small>Next: pick your {cv.shape.toLowerCase()} diamond</small></button>
              ) : (
                <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={() => add(variant.id)}>{!variant.available ? "Sold out" : busy ? "Adding…" : `Add to bag · ${usd(variant.price)}`}</button>
              )}
              <Link href="/#contact" className="pp-appt">Book a private appointment</Link>
            </div>
            <div className="pp-trust">{TRUST.map(([d, t]) => <div key={t}><Ic d={d} />{t}</div>)}</div>

            <div className="pp-acc">
              <details open><summary>Description</summary><div className="pp-desc" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} /></details>
              <details><summary>Details</summary><ul><li>Lab-grown diamonds, independently certified</li>{metal && <li>Metal: {metal}</li>}{details.map(t => <li key={t}>{t}</li>)}</ul></details>
              <details><summary>Shipping &amp; returns</summary><p>Free insured shipping. Returns within 30 days. Every piece arrives in a Meekitaz box with its certificate.</p></details>
              <details><summary>Care</summary><p>Store separately, avoid harsh chemicals, and clean with warm water and a soft brush. Complimentary cleaning for life at our showroom.</p></details>
            </div>
          </div>
        </div>

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

      <div className="pp-sbar">
        <div><b>{usd(price)}</b>{compareAt > 0 && <s>{usd(compareAt)}</s>}</div>
        {ring && cv ? <button type="button" className="pp-add" onClick={chooseSetting}>Choose this setting</button> : <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={() => add(variant.id)}>{variant.available ? "Add to bag" : "Sold out"}</button>}
      </div>
    </main>
  );
}
