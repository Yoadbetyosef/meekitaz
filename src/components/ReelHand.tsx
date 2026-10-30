"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { handle: string; title: string; price: number; video?: string; image?: string; detail: string };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const EVERY = 3500; // ms between deals

export default function ReelHand({ items }: { items: Item[] }) {
  const [front, setFront] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const n = items.length;

  // deal the front card away every few seconds — only while the block is on screen, never under reduced motion
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const deal = () => {
      setFront(f => { setLeaving(f); setTimeout(() => setLeaving(null), 900); return (f + 1) % n; });
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!timer) timer = setInterval(deal, EVERY); }
      else if (timer) { clearInterval(timer); timer = null; }
    }, { threshold: 0.35 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
  }, [n]);

  const cur = items[front];
  return (
    <section className="rh-wrap" aria-label="Ready to Ship" ref={ref}>
      <div className="rh">
        <img className="rh-m" src="/brand/meekitaz-m-white.png" alt="" aria-hidden="true" loading="lazy" />
        <div className="rh-copy">
          <p className="rh-eye"><i />Ready to ship</p>
          <h2 className="rh-h">Ready to ship.<em>One of each.</em></h2>
          <p className="rh-lead">Every piece in this deck is filmed, graded, boxed and sitting in New York. When it&rsquo;s claimed, it&rsquo;s gone &mdash; there is no second one.</p>
          <div className="rh-now" aria-live="polite">
            <small>On the table now</small>
            <b>{cur.title}</b>
            {cur.detail && <span>{cur.detail}</span>}
            <em>{usd(cur.price)}</em>
          </div>
          <div className="rh-row">
            <Link href={`/ready-to-ship#${cur.handle}`} className="rh-btn">Claim it &middot; ships in 48h &rarr;</Link>
            <Link href="/ready-to-ship" className="rh-all">See all 2,900 pieces</Link>
          </div>
        </div>
        <div className="rh-hand" aria-hidden="true">
          {items.map((it, k) => {
            const pos = k === leaving ? "out" : (k - front + n) % n;
            return (
              <Link key={it.handle} href={`/ready-to-ship#${it.handle}`} className="rh-card" data-pos={pos} tabIndex={-1}>
                {it.video
                  ? <video src={it.video} muted loop playsInline autoPlay preload={k < 2 ? "auto" : "metadata"} poster={it.image} />
                  : <img src={it.image} alt="" loading="lazy" />}
                <span className="rh-cap"><b>{it.title}</b><em>{usd(it.price)}</em></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
