"use client";
import { useEffect, useRef } from "react";

/** The footer's lime: solid at the far side, breaking into slow-moving squares toward her (the same squares as the "Worn lightly" band). */
export default function FooterSquares() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, cx = cv?.getContext("2d");
    if (!cv || !cx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hash = (a: number, b: number) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
    let raf = 0, on = false, last = 0;
    const draw = (now: number) => {
      raf = 0;
      if (now - last > 70 || still) {
        last = now;
        const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
        if (W && H) {
          if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
          const tall = window.innerWidth <= 767, S = Math.max(14, tall ? H / 7 : W / 13), t = still ? 0 : now / 1400;
          cx.clearRect(0, 0, W, H); cx.fillStyle = "#E1FF4F";
          for (let j = 0; j * S < H; j++) for (let i = 0; i * S < W; i++) {
            const k = tall ? 1 - ((j + .5) * S) / H : ((i + .5) * S) / W, rnd = hash(i + 1, j + 1);
            if (k * 2.3 - .2 + .17 * Math.sin(t + rnd * 6.283) > rnd) cx.fillRect(Math.floor(i * S), Math.floor(j * S), Math.ceil(S) + 1, Math.ceil(S) + 1);
          }
        }
      }
      if (on && !still) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const io = new IntersectionObserver(es => { on = es.some(e => e.isIntersecting); if (on) kick(); }, { rootMargin: "200px" });
    io.observe(cv); window.addEventListener("resize", kick);
    return () => { io.disconnect(); window.removeEventListener("resize", kick); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <canvas className="fq-sq" ref={ref} aria-hidden="true" />;
}
