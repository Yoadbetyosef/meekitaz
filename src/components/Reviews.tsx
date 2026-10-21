"use client";
import { useRef } from "react";
import Image from "next/image";
import { reviews } from "@/lib/data";
import { brand } from "@/brands";
import Stars from "./Stars";

type GReview = { name: string; text: string; date: string; photos?: string[] };

/** Real Google reviews as a slow, staggered reel: tall photo cards at alternating heights, the review floating on a pill under each one.
 *  Reviews without a customer photo get a pastel card with a big quote mark. Pauses on hover; a plain scrollable row for reduced-motion users. */
function ReviewsReel() {
  const rv = brand.reviews!;
  const card = (r: GReview, i: number, copy: number) => {
    const photo = r.photos?.[0];
    return (
      <article className="rl-card" key={`${copy}-${r.name}-${r.date}`} style={{ ["--o" as string]: i % 2 ? "48px" : "0px" }} aria-hidden={copy ? true : undefined}>
        {photo ? (
          <div className="rl-ph">
            {/* hot-linked customer photo (Google-hosted); plain <img> keeps it out of the Next image optimiser */}
            <img src={photo} alt={copy ? "" : `Photo shared by ${r.name} with their review`} loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = "none"; }} />
          </div>
        ) : (
          <div className={`rl-ph rl-no rl-k${(i % 4) + 1}`}><i>“</i></div>
        )}
        <div className="rl-pill"><p>“{r.text}”</p><small>{r.name} · {r.date}</small></div>
      </article>
    );
  };
  return (
    <section className="sec rl" id="reviews" aria-label="Reviews">
      <div className="wrap">
        <div className="rl-head">
          <div className="rl-big" aria-label={`${rv.rating.toFixed(1)} out of 5`}>{rv.rating.toFixed(1)}</div>
          <div className="rl-meta">
            <small className="eyebrow">Reviews</small>
            <h2 className="h2">Loved by our clients</h2>
            <p className="rl-sum"><Stars /><span>{rv.count} {rv.source} reviews</span></p>
          </div>
        </div>
      </div>
      <div className="rl-view">
        <div className="rl-row">
          {rv.items.map((r, i) => card(r, i, 0))}
          {rv.items.map((r, i) => card(r, i, 1))}
        </div>
      </div>
    </section>
  );
}

function SampleReviews() {
  const t = useRef<HTMLDivElement>(null);
  const step = (dir: number) => { const el = t.current; if (!el) return; const w = (el.querySelector(".rv") as HTMLElement)?.offsetWidth || 320; el.scrollBy({ left: dir * (w + 18), behavior: "smooth" }); };
  return (
    <section className="sec" id="reviews" aria-label="Reviews">
      <div className="wrap">
        <div className="sec-head sec-head-row">
          <div><small className="eyebrow">Reviews</small><h2 className="h2">Worn lightly, loved loudly</h2></div>
          <div className="rv-nav"><button aria-label="Previous" onClick={() => step(-1)}>←</button><button aria-label="Next" onClick={() => step(1)}>→</button></div>
        </div>
      </div>
      <div className="rv-track" ref={t}>
        {reviews.map(r => (
          <article className="rv" key={r.name}>
            <div className="rv-img"><Image src={r.img} alt="" fill sizes="(max-width:767px) 80vw, 320px" quality={70} /></div>
            <div className="rv-body"><Stars /><p>“{r.text}”</p><div className="rv-who"><b>{r.name}</b><span>{r.city}</span><em>{r.product}</em></div></div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Brands with real reviews in their config get the reel; the rest keep the sample-review slider. */
export default function Reviews() {
  return brand.reviews ? <ReviewsReel /> : <SampleReviews />;
}
