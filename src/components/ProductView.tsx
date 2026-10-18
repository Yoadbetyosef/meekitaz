"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import type { ProductFull, Related, Sibling } from "@/lib/shopify";
import { metalOf } from "@/lib/shopify";
import { photoSrc, isCleaned } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SW: Record<string, string> = { "Rose Gold": "#E3AE98", "Yellow Gold": "#E6C56B", "White Gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB" };
const Ic = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const TRUST = [
  ["M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7zM8.5 12l2.5 2.5L15.5 10", "IGI / GIA certified diamonds"],
  ["M4 8h12a4 4 0 010 8H8M7 5L4 8l3 3", "30-day free returns"],
  ["M12 12c2-3 5-4 6-2s-1 5-4 4l-4-2c-3-1-5 0-5 2s3 3 6 0z", "Lifetime warranty"],
  ["M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 17.5h.01M17 17.5h.01", "Free insured shipping"],
];

export default function ProductView({ product: p, siblings, related }: { product: ProductFull; siblings: Sibling[]; related: Related[] }) {
  const { add, busy } = useCart();
  const real = p.options.filter(o => !(o.values.length === 1 && o.values[0] === "Default Title") && o.name !== "Title");
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries((p.variants[0]?.selected || []).map(s => [s.name, s.value])));
  const variant = useMemo(() => p.variants.find(v => v.selected.every(s => sel[s.name] === s.value)) || p.variants[0], [p, sel]);
  const [slide, setSlide] = useState(0);
  const car = useRef<HTMLDivElement>(null);
  const metal = metalOf(p.tags);
  const save = variant.compareAt ? variant.compareAt - variant.price : 0;
  const details = p.tags.filter(t => !/gold|silver|platinum|rose|yellow|white|^NS-|^CBR$|express|normal_side|^RJ-/i.test(t)).slice(0, 4);
  const imgs = p.images;

  return (
    <main className="pp">
      <div className="wrap">
        <p className="pp-crumb"><Link href="/">Home</Link> / {p.productType || "Shop"}{metal ? ` / ${metal}` : ""}</p>
        <div className="pp-grid">
          {/* desktop: stacked gallery */}
          <div className="pp-gal">
            {imgs.map((im, i) => (
              <figure key={im.url} className={i === 0 ? "first" : ""}>
                <Image src={photoSrc(im.url, 1100, p.title, i)} alt={im.alt} fill sizes="(max-width:1100px) 50vw, 620px" quality={78} priority={i === 0} unoptimized={isCleaned(photoSrc(im.url, 1100, p.title, i))} />
              </figure>
            ))}
          </div>
          {/* phone: swipe */}
          <div className="pp-carw">
            <div className="pp-car" ref={car} onScroll={() => car.current && setSlide(Math.round(car.current.scrollLeft / car.current.clientWidth))}>
              {imgs.map((im, i) => <figure key={im.url}><Image src={photoSrc(im.url, 900, p.title, i)} alt={im.alt} fill sizes="100vw" quality={75} priority={i === 0} unoptimized={isCleaned(photoSrc(im.url, 900, p.title, i))} /></figure>)}
            </div>
            {imgs.length > 1 && <span className="pp-cnt">{slide + 1} / {imgs.length}</span>}
          </div>

          <div className="pp-info">
            <small className="eyebrow">Lab-grown · IGI certified</small>
            <h1>{p.title}</h1>
            <div className="pp-price"><b>{usd(variant.price)}</b>{variant.compareAt > 0 && <><s>{usd(variant.compareAt)}</s><i>Save {usd(save)}</i></>}</div>
            <p className="pp-sub">Serious diamonds, worn lightly.</p>

            {siblings.length > 1 && (
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
              <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={() => add(variant.id)}>{!variant.available ? "Sold out" : busy ? "Adding…" : `Add to bag · ${usd(variant.price)}`}</button>
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
        <div><b>{usd(variant.price)}</b>{variant.compareAt > 0 && <s>{usd(variant.compareAt)}</s>}</div>
        <button type="button" className="pp-add" disabled={busy || !variant.available} onClick={() => add(variant.id)}>{variant.available ? "Add to bag" : "Sold out"}</button>
      </div>
    </main>
  );
}
