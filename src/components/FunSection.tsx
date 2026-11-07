"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Home (2026-11-07). The page she lifted: the dancer fills the section (a fast ⅓s appearance, tinted to the page colour), dances once
   and leaves; then Meekitaz Daily ("W2 · the ticket") takes the same screen — the statement fills with blue word by word, then the
   three numbers and the plan ticket come in. One screen, no scrolling. Every return to this section plays her again. */
const PIECES: [string, string, number][] = [["ring", "Hidden halo ring", 1089], ["brac", "Tennis bracelet", 1800], ["neck", "Tennis necklace", 4800]];
const STATEMENT = "Pay a little every day. Wear it from the first one. It’s yours.";
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function FunSection() {
  const sec = useRef<HTMLElement>(null), v = useRef<HTMLVideoElement>(null), p = useRef<HTMLParagraphElement>(null);
  const [day, setDay] = useState(15), [months, setMonths] = useState(4);
  useEffect(() => {
    const s = sec.current, vid = v.current, para = p.current; if (!s || !vid || !para) return;
    const words = [...para.querySelectorAll("span")];
    let started = false, goneAt = 0, raf = 0;
    const src = window.matchMedia("(max-width:767px)").matches ? "/media/dancer-m.mp4" : "/media/dancer.mp4";
    const reset = () => { started = false; goneAt = 0; s.classList.remove("fun-in", "fun-gone", "fun-cta"); words.forEach(w => w.classList.remove("on")); vid.pause(); };
    const start = () => { if (started) return; started = true; if (!vid.getAttribute("src")) vid.src = src; vid.muted = true; vid.currentTime = 0; vid.play().catch(() => {}); s.classList.add("fun-in"); };
    (s as HTMLElement & { __start?: () => void }).__start = start; // HeroLift calls this the moment the board reaches the top
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else if (started) reset(); }, { threshold: .55 });
    io.observe(s);
    const tick = () => {
      const gone = started && (vid.ended || (vid.duration > 0 && vid.currentTime >= vid.duration - .25));
      if (gone && !goneAt) goneAt = performance.now();
      s.classList.toggle("fun-gone", gone);
      if (goneAt) { const el = (performance.now() - goneAt) / 1000; const q = Math.max(0, Math.min(1, (el - .2) / 1.3)), n = Math.round(q * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); if (el > 1.6) s.classList.add("fun-cta"); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const total = day * months * 30, reach = PIECES.filter(x => x[2] <= total).pop(), piece = reach || PIECES[0];
  return (
    <section className="fun" id="fun" ref={sec} aria-label="Meekitaz Daily">
      <div className="fun-stick">
        <video ref={v} className="fun-dance" muted playsInline preload="auto" aria-hidden="true" />
        <i className="fun-tint" aria-hidden="true" />
        <div className="dly">
          <i className="fl-plus p1" aria-hidden="true" /><i className="fl-plus p3" aria-hidden="true" />
          <div className="dly-l">
            <span className="dly-kick dly-rv">Meekitaz Daily</span>
            <p className="dly-st" ref={p}>{STATEMENT.split(" ").map((w, i) => <span key={i}>{w} </span>)}</p>
            <div className="dly-three dly-rv d2"><div><b>$1–$50</b><span>a day</span></div><div><b>4 mo.</b><span>at most</span></div><div><b>5 swaps</b><span>a year</span></div></div>
            <div className="dly-facts dly-rv d3">No interest<i>·</i>No credit score<i>·</i>Everyone’s approved<i>·</i>5 swaps a year</div>
          </div>
          <div className="dly-tk dly-rv d2">
            <div className="dly-h"><span className="dly-kick">Your plan</span><img src="/brand/meekitaz-logo-ink.png" alt="Meekitaz" /></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="dly-piece"><img src={`/media/daily/${piece[0]}.webp`} alt="" /></div>
            <div className="dly-pn">{reach ? `${piece[1]} · ${usd(piece[2])}` : `${piece[1]} — ${usd(Math.ceil(piece[2] / (months * 30)))} a day gets you there`}</div>
            <span className="dly-perf" aria-hidden="true" />
            <div className="dly-ln"><span>A day</span><b>{usd(day)}</b></div>
            <div className="dly-sl">
              <input type="range" min={1} max={50} value={day} onChange={e => setDay(+e.target.value)} aria-label="Dollars a day" style={{ ["--p" as string]: ((day - 1) / 49 * 100) + "%" }} />
              <div className="dly-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === months ? "on" : ""} onClick={() => setMonths(m)} aria-label={`${m} months`}>{m}</button>)}</div>
            </div>
            <div className="dly-tot"><span>Yours, up to</span><b>{usd(total)}</b></div>
            <Link href="/engagement-rings" className="dly-cta">Start from $1 a day</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
