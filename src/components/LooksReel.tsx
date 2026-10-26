"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { looksReel } from "@/lib/data";

const N = looksReel.length;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const pad = (n: number) => String(n).padStart(2, "0");

/** Shop the look: one frame, several looks. Scrolling raises the next look from the bottom edge over the current one, which shrinks and darkens behind it.
 *  The motion follows the scroll continuously (no dead stretches), a counter says where you are and a "Next" button says there is more.
 *  Each look is a silent loop that plays only while it is the one on top. */
export default function LooksReel() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const looks = useRef<(HTMLDivElement | null)[]>([]);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const onRef = useRef(0);
  const manual = useRef(0);
  const reduce = useRef(false);
  const [on, setOn] = useState(0);
  const [near, setNear] = useState(false);

  /** f = how far through the looks we are: 0 = the first, 1 = the second fully risen, ... N-1 = the last. */
  function paint(f: number) {
    looks.current.forEach((c, i) => {
      if (!c) return;
      const q = i === 0 ? 1 : clamp(f - (i - 1)); // how far this look has risen
      const qn = i < N - 1 ? clamp(f - i) : 0; // how far the next one has covered it
      c.style.transform = `translateY(${(1 - q) * 104}%) scale(${1 - qn * 0.06})`;
      c.style.filter = qn ? `brightness(${1 - qn * 0.45})` : "";
    });
    const k = Math.min(N - 1, Math.floor(f + 0.35));
    if (k !== onRef.current) { onRef.current = k; setOn(k); }
  }

  useEffect(() => {
    const s = sec.current, tk = track.current; if (!s || !tk) return;
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(es => es.forEach(e => setNear(e.isIntersecting)), { rootMargin: "400px 0px" });
    io.observe(s);
    if (reduce.current) { paint(0); return () => io.disconnect(); }
    let raf = 0;
    const draw = () => { raf = 0; const b = tk.getBoundingClientRect(), span = b.height - window.innerHeight; paint(clamp(-b.top / (span || 1)) * (N - 1)); };
    const tick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw(); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
    return () => { io.disconnect(); window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (near && (i === on || i === on + 1) && !v.getAttribute("src")) v.setAttribute("src", looksReel[i].video); /* the next look is warmed up so it never rises blank */
      if (near && i === on) v.play().catch(() => {}); else v.pause();
    });
  }, [on, near]);

  /** The Next button: scrolls to the next look (or, with reduced motion, just shows it). */
  function next() {
    if (on >= N - 1) return;
    if (reduce.current) { manual.current = on + 1; paint(manual.current); return; }
    const tk = track.current; if (!tk) return;
    const b = tk.getBoundingClientRect(), span = b.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + b.top + ((on + 1) / (N - 1)) * span + 2, behavior: "smooth" });
  }

  return (
    <section className="sec lr" aria-label="Shop the look" ref={sec}>
      <div className="lr-track" ref={track} style={{ ["--n" as string]: N }}>
        <div className="lr-pin">
          <div className="wrap">
            <div className="lr-head"><small className="eyebrow">Shop the look</small><h2 className="h2">Everything she&rsquo;s wearing</h2></div>
            <div className="lr-stage">
              {looksReel.map((l, i) => (
                <div key={l.title} ref={el => { looks.current[i] = el; }} className={`lr-look${i === on ? " on" : ""}`} style={{ zIndex: i + 1, transform: i === 0 ? "none" : "translateY(104%)", ["--pos-m" as string]: l.posM }} aria-hidden={i !== on}>
                  <video ref={el => { vids.current[i] = el; }} muted loop playsInline preload="none" poster={l.poster} />
                  <div className="lr-big" aria-hidden="true">{l.title}</div>
                  <div className="lr-cap"><small>Look {pad(i + 1)}</small><b>{l.title}</b><span>{l.line}</span><Link href={l.href} className="pill lr-go" tabIndex={i === on ? 0 : -1}>Shop this piece</Link></div>
                </div>
              ))}
              <div className="lr-segs" aria-hidden="true">{looksReel.map((l, i) => <i key={l.title} className={i === on ? "on" : ""} />)}</div>
              <div className="lr-count" aria-hidden="true">{pad(on + 1)} / {pad(N)}</div>
              <button type="button" className={`lr-next${on >= N - 1 ? " off" : ""}`} onClick={next} tabIndex={on >= N - 1 ? -1 : 0} aria-label="Next look">Next<em> &middot; {looksReel[Math.min(on + 1, N - 1)].title}</em></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
