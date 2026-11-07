"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Home (2026-11-07). The page she lifted: the dancer fills the section (a fast ⅓s appearance, tinted to the page colour), dances once
   and leaves; then Meekitaz Daily ("W2 · the ticket rail") takes the same screen — the statement fills with blue word by word, the
   three numbers, the badges (5 swaps in yellow), the reviews and the trust marks come in, and the plan ticket: the whole collection
   lights up with the price, the button says the day you chose. One screen, no scrolling. Every return to this section plays her again. */
const ITEMS: [string, number, string, string][] = [["Baguette cluster studs · Silver", 349, "q00.webp", "silver-baguette-diamond-cluster-stud-earrings"], ["Round basket-set studs · Yellow gold", 363, "q01.webp", "yellow-gold-round-diamond-basket-set-stud-earrings-with-diamond-accent"], ["Marquise ivy climbers · Yellow gold", 573, "q02.webp", "yellow-gold-marquise-and-round-diamond-ivy-climber-earrings"], ["Oval solitaire, pavé band · White gold", 699, "q03.webp", "oval-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band"], ["Emerald solitaire, pavé band · White gold", 699, "q04.webp", "emerald-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band"], ["Woven eternity band · Silver", 1133, "q05.webp", "silver-round-diamond-woven-full-eternity-band"], ["Oval floral halo studs · Platinum", 1763, "q06.webp", "platinum-oval-diamond-floral-halo-stud-earrings"], ["Mixed-shape bezel eternity band · Yellow gold", 3625, "q07.webp", "yellow-gold-mixed-shape-diamond-bezel-set-eternity-wedding-band"], ["Emerald bezel tennis bracelet · Yellow gold", 3709, "q08.webp", "yellow-gold-emerald-cut-diamond-tennis-bracelet-with-bezel-setting"], ["Round tennis necklace · Yellow gold", 3947, "q09.webp", "yellow-gold-round-diamond-tennis-necklace-with-three-prong-setting"], ["Emerald four-prong tennis bracelet · Yellow gold", 4213, "q10.webp", "yellow-gold-emerald-cut-diamond-tennis-bracelet-with-four-prong-setting"]]; // chosen by Yoad (2026-11-07): [name, price, image, handle]
const STATEMENT = "Pay a little every day. Wear it from the first one. It’s yours.";
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function FunSection() {
  const sec = useRef<HTMLElement>(null), v = useRef<HTMLVideoElement>(null), p = useRef<HTMLParagraphElement>(null);
  const [day, setDay] = useState(15), [months, setMonths] = useState(4), [pinned, setPinned] = useState(-1);
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
  const total = day * months * 30;
  let best = -1; ITEMS.forEach((x, i) => { if (x[1] <= total) best = i; });
  const cur = pinned >= 0 && ITEMS[pinned][1] <= total ? pinned : best >= 0 ? best : 0;
  const n = ITEMS.filter(x => x[1] <= total).length;
  const choose = (i: number) => { setPinned(i); if (ITEMS[i][1] > total) setDay(Math.min(50, Math.ceil(ITEMS[i][1] / (months * 30)))); };
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
            <div className="dly-badges dly-rv d3"><i>No interest</i><i>No credit score</i><i>Everyone’s approved</i><i className="hl">5 swaps a year</i></div>
            <div className="dly-rev dly-rv d4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="dly-faces">{["maya", "david", "jess", "linda"].map(k => <img key={k} src={`/media/daily/faces/${k}.jpg`} alt="" />)}</div>
              <div className="dly-sc"><b>5.0 <em aria-label="5 stars">★★★★★</em></b><span>Loved by our clients</span></div>
              <i className="dly-sep" aria-hidden="true" />
              <div className="dly-trust"><span>IGI / GIA certified</span><span>Lifetime warranty</span><span>30-day free returns</span></div>
            </div>
          </div>
          <div className="dly-tk dly-rv d2">
            <div className="dly-h"><span className="dly-kick">Your plan</span><img src="/brand/meekitaz-logo-ink.png" alt="Meekitaz" /></div>
            <div className="dly-stage">{ITEMS.map((x, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={x[2]} src={`/media/daily/p2/${x[2]}`} alt={i === cur ? x[0] : ""} className={i === cur ? "on" : ""} />
            ))}</div>
            <div className="dly-pn">{best >= 0 ? `${ITEMS[cur][0]} · ${usd(ITEMS[cur][1])}` : `${ITEMS[0][0]} — ${usd(Math.ceil(ITEMS[0][1] / (months * 30)))} a day gets you there`}</div>
            <div className="dly-rail">{ITEMS.map((x, i) => (
              <button key={x[2]} type="button" className={`${x[1] > total ? "off" : ""}${i === cur ? " cur" : ""}`} onClick={() => choose(i)} aria-label={`${x[0]}, ${usd(x[1])}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/daily/p2/${x[2]}`} alt="" />
              </button>
            ))}</div>
            <div className="dly-cnt">{n ? `${n} of ${ITEMS.length} pieces are yours at this price` : "Move the day — the collection opens up"}</div>
            <span className="dly-perf" aria-hidden="true" />
            <div className="dly-ln"><span>A day</span><b>{usd(day)}</b></div>
            <div className="dly-sl">
              <input type="range" min={1} max={50} value={day} onChange={e => { setDay(+e.target.value); setPinned(-1); }} aria-label="Dollars a day" style={{ ["--p" as string]: ((day - 1) / 49 * 100) + "%" }} />
              <div className="dly-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === months ? "on" : ""} onClick={() => setMonths(m)} aria-label={`${m} months`}>{m}</button>)}</div>
            </div>
            <div className="dly-tot"><span>Yours, up to</span><b>{usd(total)}</b></div>
            <Link href="/engagement-rings" className="dly-cta">Start at {usd(day)} a day</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
