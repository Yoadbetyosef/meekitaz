"use client";
import { useEffect, useRef } from "react";

/* (2026-11-16, approved "A") The swallow with the pink box, big. When the footer comes into view she takes off from beyond the left
   edge, flies a wide arc over the woman and lands on the top of "Shhh.", where she stays. The flight runs on its own clock (not tied
   to the scroll), so it is always seen from start to finish; scrolling well away resets it, so it plays again next time.
   Transforms only; reduced motion shows her already sitting. There is no drawing of her perched: the sitting pose is the frame with
   the wings most closed. (Before: small, and flown by the last few centimetres of scroll — DESIGNS.md.) */
export default function FooterBird() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = ref.current, page = document.getElementById("mk-page"), inner = document.getElementById("mkfoot-in");
    const h = inner?.querySelector<HTMLElement>(".fq-say h2"), band = inner?.querySelector<HTMLElement>(".fq-band");
    if (!b || !page || !inner || !h || !band) return;
    const N = 12, SIT = 9, DUR = 3000, reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let P: [number, number][] = [], raf = 0, t0 = 0, state: "out" | "fly" | "sat" = "out";
    const build = () => {
      const o = inner.getBoundingClientRect(), r = h.getBoundingClientRect(), k = band.getBoundingClientRect();
      const W = o.width, Hb = k.height, bw = b.offsetWidth, bh = b.offsetHeight, fs = parseFloat(getComputedStyle(h).fontSize) || 100;
      const sx = r.left - o.left + r.width * .16 - bw * .5, sy = r.top - o.top + fs * .1 - bh * .84, top = k.top - o.top;
      const hi = (y: number) => Math.max(top - bh * .15, y);
      P = [[-bw * 1.3, sy + Hb * .25], [W * .2, hi(sy - Hb * .55)], [Math.max(W * .1, sx - W * .25), hi(sy - Hb * .5)], [sx, sy]];
    };
    const bez = (t: number) => { const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
    const frame = (f: number) => { b.style.backgroundPosition = `${(f / (N - 1)) * 100}% 0`; };
    const place = (t: number) => {
      const [x, y] = bez(t), [x2, y2] = bez(Math.min(1, t + .01)), sit = t >= 1;
      b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(sit ? -12 : Math.atan2(y2 - y, x2 - x) * 60 / Math.PI).toFixed(1)}deg)`;
      if (sit) frame(SIT);
    };
    const tick = (now: number) => {
      raf = 0; if (state !== "fly") return;
      const u = Math.min(1, (now - t0) / DUR), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      place(e);
      if (u >= 1) { state = "sat"; return; }
      frame(Math.floor(((now - t0) / 1000) * 12) % N);
      raf = requestAnimationFrame(tick);
    };
    // how far the footer is revealed (0 → 1), exactly as FooterFx measures it
    const shown = () => Math.max(0, Math.min(1, (window.innerHeight - page.getBoundingClientRect().bottom) / window.innerHeight));
    const check = () => {
      const s = shown();
      if (state === "out" && s > .5) { build(); state = "fly"; t0 = performance.now(); b.style.visibility = "visible"; if (!raf) raf = requestAnimationFrame(tick); }
      else if (state !== "out" && s < .08) { state = "out"; b.style.visibility = "hidden"; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    };
    build();
    if (reduced) { b.style.visibility = "visible"; place(1); return; }
    b.style.visibility = "hidden"; check();
    const onResize = () => { build(); if (state === "sat") place(1); check(); };
    window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", onResize); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="fq-bird" ref={ref} aria-hidden="true" />;
}
