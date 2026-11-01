"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { looksReel } from "@/lib/data";

const N = looksReel.length;
const pad = (n: number) => String(n).padStart(2, "0");
const STEP = 7000; // ms each look stays, like a story

/** Shop the look, as stories (2026-10-31): a normal block (no scroll-jacking). One look at a time; a tap moves to the next
 *  (a tap on the left third goes back), and each look also moves on by itself, with progress bars on top like a story.
 *  Each look is a silent loop that plays only while it is on screen and on top. */
export default function LooksReel() {
  const sec = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [on, setOn] = useState(0);
  const [near, setNear] = useState(false);
  const [run, setRun] = useState(0); // restarts the progress bar and the timer on every change

  const go = useCallback((k: number) => { setOn(((k % N) + N) % N); setRun(r => r + 1); }, []);

  useEffect(() => {
    const s = sec.current; if (!s) return;
    const io = new IntersectionObserver(es => es.forEach(e => setNear(e.isIntersecting)), { threshold: 0.35 });
    io.observe(s); return () => io.disconnect();
  }, []);

  useEffect(() => { // auto-advance only while the block is on screen
    if (!near || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(on + 1), STEP); return () => clearTimeout(t);
  }, [on, near, run, go]);

  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      const want = i === on || i === (on + 1) % N; // the next look is warmed up so it never appears blank
      if (near && want && !v.getAttribute("src")) v.setAttribute("src", looksReel[i].video);
      if (near && i === on) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause();
    });
  }, [on, near]);

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("a,button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    go(e.clientX - r.left < r.width * 0.3 ? on - 1 : on + 1);
  };

  return (
    <section className={`sec lr lr-story${near ? " live" : ""}`} aria-label="Shop the look" ref={sec}>
      <div className="lr-track">
        <div className="lr-pin">
          <div className="wrap">
            <div className="lr-head"><small className="eyebrow">Shop the look</small><h2 className="h2">Everything she&rsquo;s wearing</h2></div>
            <div className="lr-stage" onClick={tap} role="group" aria-roledescription="stories" aria-label={`Look ${on + 1} of ${N}. Tap for the next look.`}>
              {looksReel.map((l, i) => (
                <div key={l.title} className={`lr-look${i === on ? " on" : ""}`} style={{ zIndex: i === on ? 2 : 1, ["--pos-m" as string]: l.posM }} aria-hidden={i !== on}>
                  <video ref={el => { vids.current[i] = el; }} muted loop playsInline preload="none" poster={l.poster} />
                  <div className="lr-cap"><small>Look {pad(i + 1)}</small><b>{l.title}</b><span>{l.line}</span><Link href={l.href} className="pill lr-go" tabIndex={i === on ? 0 : -1}>Shop this piece</Link></div>
                </div>
              ))}
              <div className="lr-segs" aria-hidden="true">{looksReel.map((l, i) => <i key={`${l.title}-${i === on ? run : 0}`} className={i < on ? "done" : i === on ? "on" : ""} />)}</div>
              <button type="button" className="lr-next" onClick={() => go(on + 1)} aria-label="Next look">Next<em> &middot; {looksReel[(on + 1) % N].title}</em></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
