"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { looksReel } from "@/lib/data";

/** Shop the look as a reel: one frame, three looks; scrolling flips between them. Each look is a silent loop that plays only while it is the one on screen. */
export default function LooksReel() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [on, setOn] = useState(0);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const s = sec.current, tk = track.current; if (!s || !tk) return;
    const io = new IntersectionObserver(es => es.forEach(e => setNear(e.isIntersecting)), { rootMargin: "400px 0px" });
    io.observe(s);
    let raf = 0;
    const draw = () => { raf = 0; const b = tk.getBoundingClientRect(), span = b.height - window.innerHeight; const t = Math.max(0, Math.min(0.999, -b.top / (span || 1))); setOn(Math.floor(t * looksReel.length)); };
    const tick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw(); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
    return () => { io.disconnect(); window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    vids.current.forEach((v, i) => { if (!v) return; if (near && i === on) { if (!v.getAttribute("src")) v.setAttribute("src", looksReel[i].video); v.play().catch(() => {}); } else v.pause(); });
  }, [on, near]);
  return (
    <section className="sec lr" aria-label="Shop the look" ref={sec}>
      <div className="wrap lr-head">
        <div className="sl-head">
          <div><small className="eyebrow">Shop the look</small><h2 className="h2">Everything she&rsquo;s wearing</h2></div>
        </div>
      </div>
      <div className="lr-track" ref={track}>
        <div className="lr-pin">
          <div className="wrap">
            <div className="lr-stage">
              {looksReel.map((l, i) => (
                <div key={l.title} className={`lr-look${i === on ? " on" : ""}`} aria-hidden={i !== on}>
                  <video ref={el => { vids.current[i] = el; }} muted loop playsInline preload="none" poster={l.poster} />
                  <div className="lr-big" aria-hidden="true">{l.title}</div>
                  <div className="lr-cap"><small>Look {String(i + 1).padStart(2, "0")}</small><b>{l.title}</b><span>{l.line}</span><Link href={l.href} className="pill lr-go" tabIndex={i === on ? 0 : -1}>Shop the look</Link></div>
                </div>
              ))}
              <div className="lr-dots" aria-hidden="true">{looksReel.map((l, i) => <i key={l.title} className={i === on ? "on" : ""} />)}</div>
            </div>
            <div className="sl-cta"><Link href="/looks" className="pill sl-all">See all looks &rarr;</Link></div>
          </div>
        </div>
      </div>
    </section>
  );
}
