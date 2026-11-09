"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

/* Ready to ship on the home page (approved 2026-11-09, "V2 · the arch window"): butter ground, the bicycle film (the Meekitaz boxes in her
   basket) in an arched window, a big "Ready to ship." The film plays only while on screen.
   The swallow (approved 2026-11-09, "W1"): one real wingbeat cut from his film (12 transparent frames, the white logo on the box kept),
   flapping steadily while she flies with the scroll — in from beyond the left edge, a gentle rise above the heading, over the top of the
   arch, out beyond the right edge. Scrolling back reverses her. No pinning, transforms only, no clicks, no sideways overflow;
   reduced motion shows her still above the heading. */
export default function RtsBike() {
  const v = useRef<HTMLVideoElement>(null), sec = useRef<HTMLElement>(null), bird = useRef<HTMLDivElement>(null), eye = useRef<HTMLParagraphElement>(null), arch = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const s = sec.current, b = bird.current, k = eye.current, a = arch.current; if (!s || !b || !k || !a) return;
    const N = 12, reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const off = (el: HTMLElement) => { let y = 0, n: HTMLElement | null = el; while (n && n !== s) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; } return y; };
    let P: [number, number][] = [];
    const build = () => {
      const W = s.clientWidth, bw = b.offsetWidth, bh = b.offsetHeight;
      const y0 = Math.max(4, off(k) - bh - 16);
      const beside = a.getBoundingClientRect().left > k.getBoundingClientRect().right; // computers: the arch sits beside the copy
      const yA = beside ? Math.min(y0 - 40, off(a) - bh - 24) : y0 - 40;
      P = [[-bw * 1.2, y0], [W * .3, y0 - 14], [W * .6, yA], [W + bw * .4, yA - 40]];
    };
    const bez = (t: number) => { const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
    const place = (t: number) => { const [x, y] = bez(t), [x2, y2] = bez(Math.min(1, t + .01)); const ang = Math.atan2(y2 - y, x2 - x) * 90 / Math.PI; b.style.transform = `translate3d(${x}px,${y}px,0) rotate(${ang.toFixed(2)}deg)`; };
    const progress = () => { const r = s.getBoundingClientRect(), H = window.innerHeight; return Math.min(1, Math.max(0, (H - r.top) / (H + r.height))); };
    let cur = 0, target = 0, raf = 0, ft = 0, last = performance.now(), on = false;
    const setFrame = (f: number) => { b.style.backgroundPosition = `${(Math.floor(((f % N) + N) % N) / (N - 1)) * 100}% 0`; };
    build();
    if (reduced) { place(.36); setFrame(0); return; }
    cur = target = progress(); place(cur);
    const tick = (now: number) => {
      cur += (target - cur) * .12; if (Math.abs(target - cur) < .0005) cur = target; place(cur);
      ft += Math.min(.05, (now - last) / 1000) * 12; last = now; setFrame(ft); // a steady wingbeat, 12 frames a second
      raf = on ? requestAnimationFrame(tick) : 0;
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const onScroll = () => { target = progress(); };
    const onResize = () => { build(); place(cur); };
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) start(); }, { rootMargin: "120px 0px" });
    io.observe(s);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onResize);
    return () => { io.disconnect(); on = false; cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/rts/bike-arch.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else vid.pause();
    }, { threshold: .2 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  const band = "Order today \u00b7 Ships today \u00b7 Free insured delivery \u00b7 30-day returns";
  return (
    <section className="rtsb" aria-label="Ready to ship" ref={sec}>
      <div className="rtsb-in">
        <div className="rtsb-copy">
          <p className="rtsb-eye" ref={eye}><i />In stock</p>
          <h2 className="rtsb-h">Ready to ship.</h2>
          <p className="rtsb-it">Packed this morning. Yours by Friday.</p>
          <Link href="/ready-to-ship" className="rtsb-btn">Shop in-stock jewelry &rarr;</Link>
        </div>
        <Link href="/ready-to-ship" ref={arch} className="rtsb-arch" aria-label="Shop ready to ship" tabIndex={-1}>
          <video ref={v} muted loop playsInline preload="none" poster="/media/rts/bike-arch.jpg" aria-hidden="true" />
        </Link>
        <i className="rtsb-dr d1" aria-hidden="true" /><i className="rtsb-dr d2" aria-hidden="true" />
      </div>
      <div className="rtsb-bird" ref={bird} aria-hidden="true" />
      <div className="rtsb-band" aria-hidden="true"><div>{Array.from({ length: 8 }, (_, k) => <span key={k}>{band}</span>)}</div></div>
    </section>
  );
}
