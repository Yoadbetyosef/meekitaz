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
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const frontRef = useRef(0);
  const n = items.length;

  // a card's film is ready when it can play straight through without stalling
  const ready = (k: number) => { const v = vids.current[k]; return !v || v.readyState >= 3; };
  // start buffering a card before it comes up (phones ignore preload, so a muted play-then-pause makes them fetch it)
  const warm = (k: number) => {
    const v = vids.current[k]; if (!v || v.readyState >= 3) return;
    v.preload = "auto"; if (v.networkState === 0 || v.readyState === 0) v.load();
    v.play().then(() => { if (k !== frontRef.current) { v.pause(); v.currentTime = 0; } }).catch(() => {});
  };

  // deal the front card away every few seconds — only while the block is on screen, never under reduced motion
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | null = null, waited = 0;
    const deal = () => {
      // don't bring up a card whose film hasn't loaded yet — wait up to two more beats for it
      const next = (frontRef.current + 1) % n;
      if (!ready(next) && waited < 2) { waited++; warm(next); return; }
      waited = 0;
      setFront(f => { setLeaving(f); setTimeout(() => setLeaving(null), 900); return (f + 1) % n; });
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { warm(frontRef.current); warm((frontRef.current + 1) % n); if (!timer) timer = setInterval(deal, EVERY); }
      else if (timer) { clearInterval(timer); timer = null; }
    }, { threshold: 0.35 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
  }, [n]);

  // only the card on top plays — it starts from the beginning as it comes up; every card behind it is a still (its poster)
  useEffect(() => {
    frontRef.current = front;
    vids.current.forEach((v, k) => {
      if (!v) return;
      if (k === front) { v.currentTime = 0; v.play().catch(() => {}); }
      else v.pause();
    });
    warm((front + 1) % n); warm((front + 2) % n); // the next two are loading while this one plays
  }, [front, n]);

  const cur = items[front];

  return (
    <section className="rh-wrap" aria-label="Ready to Ship" ref={ref}>
      <div className="rh">
        <div className="rh-copy">
          <p className="rh-eye"><i />In stock</p>
          <h2 className="rh-h">Ready to ship.</h2>
          <Link href="/ready-to-ship" className="rh-btn">Shop ready to ship &rarr;</Link>
        </div>
        <div className="rh-hand" aria-hidden="true">
          {items.map((it, k) => {
            const pos = k === leaving ? "out" : (k - front + n) % n;
            return (
              <Link key={it.handle} href={`/ready-to-ship#${it.handle}`} className="rh-card" data-pos={pos} tabIndex={-1}>
                {it.video
                  ? <video ref={el => { vids.current[k] = el; }} src={it.video} muted loop playsInline preload={k === front || k === (front + 1) % n || k === (front + 2) % n ? "auto" : "none"} poster={it.image} />
                  : <img src={it.image} alt="" loading="lazy" />}
                <span className="rh-cap"><b>{it.title}</b><em>{usd(it.price)}</em></span>
              </Link>
            );
          })}
        </div>
        {/* phone: the name and price sit under the fan, so nothing covers the stone */}
        <p className="rh-cur" aria-live="polite"><b>{cur.title}</b><em>{usd(cur.price)}</em></p>
      </div>
    </section>
  );
}
