"use client";
import { useEffect, useRef } from "react";

/* (2026-11-15, approved "4") The swallow with the pink box (the same 12-frame wingbeat approved for Ready to ship) comes in as the footer
   is revealed: in from the left edge, up over her, and down onto the top of "Shhh.", where she stays. Scrolling back sends her out again.
   Transforms only; reduced motion shows her already sitting. There is no drawing of her perched: the sitting pose is the frame with the
   wings most closed. */
export default function FooterBird() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = ref.current, page = document.getElementById("mk-page"), inner = document.getElementById("mkfoot-in");
    const h = inner?.querySelector<HTMLElement>(".fq-say h2"), band = inner?.querySelector<HTMLElement>(".fq-band");
    if (!b || !page || !inner || !h || !band) return;
    const N = 12, SIT = 9, reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let P: [number, number][] = [], cur = 0, target = 0, raf = 0, ft = 0, last = 0;
    const build = () => {
      const o = inner.getBoundingClientRect(), r = h.getBoundingClientRect(), k = band.getBoundingClientRect();
      const W = o.width, Hb = k.height, bw = b.offsetWidth, bh = b.offsetHeight, fs = parseFloat(getComputedStyle(h).fontSize) || 100;
      const sx = r.left - o.left + r.width * .14 - bw * .5, sy = r.top - o.top + fs * .1 - bh * .84, top = k.top - o.top;
      const hi = (y: number) => Math.max(top - bh * .2, y);
      P = [[-bw * 1.3, sy + Hb * .12], [W * .2, hi(sy - Hb * .5)], [Math.max(W * .1, sx - W * .2), hi(sy - Hb * .42)], [sx, sy]];
    };
    const bez = (t: number) => { const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
    const frame = (f: number) => { b.style.backgroundPosition = `${(f / (N - 1)) * 100}% 0`; };
    const place = (t: number) => {
      const [x, y] = bez(t), [x2, y2] = bez(Math.min(1, t + .01)), sit = t >= .995;
      const ang = sit ? -14 : Math.atan2(y2 - y, x2 - x) * 90 / Math.PI;
      b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${ang.toFixed(1)}deg)`;
      if (sit) frame(SIT);
    };
    // how far the footer is revealed (0 → 1), exactly as FooterFx measures it; she flies during the last two thirds of it
    const progress = () => { const t = Math.max(0, Math.min(1, (window.innerHeight - page.getBoundingClientRect().bottom) / window.innerHeight)); return Math.max(0, Math.min(1, (t - .3) / .68)); };
    build();
    if (reduced) { place(1); return; }
    cur = target = progress(); place(cur);
    const tick = (now: number) => {
      raf = 0;
      cur += (target - cur) * .12; if (Math.abs(target - cur) < .001) cur = target;
      place(cur);
      if (cur < .995) { ft += Math.min(.05, (now - last) / 1000) * 12; frame(Math.floor(ft) % N); }
      last = now;
      if (cur !== target || (cur > 0 && cur < .995)) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const onScroll = () => { target = progress(); kick(); };
    const onResize = () => { build(); target = progress(); place(cur); kick(); };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onResize);
    const late = window.setTimeout(onResize, 1200); // once the fonts have settled the heading's place
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); window.clearTimeout(late); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="fq-bird" ref={ref} aria-hidden="true" />;
}
