"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { reviews } from "@/lib/data";
import { brand } from "@/brands";
import Stars from "./Stars";

type GReview = { name: string; text: string; date: string; photos?: string[] };
/** A real Google review; if the customer uploaded photos, they sit on top (tap to flip through them). */
function GCard({ r, source }: { r: GReview; source: string }) {
  const [k, setK] = useState(0);
  const n = r.photos?.length || 0;
  return (
    <article className="rv rv-g">
      {n > 0 && (
        <div className="rv-img">
          {/* hot-linked customer photo (Google-hosted); plain <img> keeps it out of the Next image optimiser */}
          <img src={r.photos![k]} alt={`Photo shared by ${r.name} with their review`} loading="lazy" referrerPolicy="no-referrer" />
          <span className="rv-tag">Customer photo</span>
          {n > 1 && <button type="button" className="rv-flip" aria-label={`Next photo (${k + 1} of ${n})`} onClick={() => setK((k + 1) % n)}><span>{k + 1}/{n}</span> →</button>}
        </div>
      )}
      <div className="rv-body"><Stars /><p>“{r.text}”</p><div className="rv-who"><b>{r.name}</b><span>{source} review · {r.date}</span></div></div>
    </article>
  );
}

export default function Reviews() {
  const t = useRef<HTMLDivElement>(null);
  const step = (dir: number) => { const el = t.current; if (!el) return; const w = (el.querySelector(".rv") as HTMLElement)?.offsetWidth || 320; el.scrollBy({ left: dir * (w + 18), behavior: "smooth" }); };
  return (
    <section className="sec" id="reviews" aria-label="Reviews">
      <div className="wrap">
        <div className="sec-head sec-head-row">
          <div><small className="eyebrow">Reviews</small><h2 className="h2">{brand.reviews ? "Loved by our clients" : "Worn lightly, loved loudly"}</h2>{brand.reviews && <p className="rv-sum"><Stars /><b>{brand.reviews.rating.toFixed(1)}</b><span>{brand.reviews.count} {brand.reviews.source} reviews</span></p>}</div>
          <div className="rv-nav"><button aria-label="Previous" onClick={() => step(-1)}>←</button><button aria-label="Next" onClick={() => step(1)}>→</button></div>
        </div>
      </div>
      <div className="rv-track" ref={t}>
        {brand.reviews ? brand.reviews.items.map(r => <GCard key={r.name + r.date} r={r} source={brand.reviews!.source} />) : reviews.map(r => (
          <article className="rv" key={r.name}>
            <div className="rv-img"><Image src={r.img} alt="" fill sizes="(max-width:767px) 80vw, 320px" quality={70} /></div>
            <div className="rv-body"><Stars /><p>“{r.text}”</p><div className="rv-who"><b>{r.name}</b><span>{r.city}</span><em>{r.product}</em></div></div>
          </article>
        ))}
      </div>
    </section>
  );
}
