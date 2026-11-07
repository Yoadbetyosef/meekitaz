"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Home (2026-11-07). The page she lifted: the dancer fills the section (a fast ⅓s appearance, tinted to the page colour), dances once
   and leaves; then Meekitaz Daily ("W2 · the ticket rail") takes the same screen — the statement fills with blue word by word, the
   three numbers, the badges (5 swaps in yellow), the reviews and the trust marks come in, and the plan ticket: the whole collection
   lights up with the price, the button says the day you chose. One screen, no scrolling. Every return to this section plays her again. */
const ITEMS: [string, number, string, string, string][] = [["Round Basket-Set Studs · Silver", 209, "05", "silver-round-diamond-basket-set-stud-earrings-with-diamond-accent", "Earrings"], ["Mosaic Hoops · Silver", 265, "13", "silver-round-diamond-mosaic-hoop-earrings", "Earrings"], ["Marquise Solitaire, Pavé Band · Silver", 293, "62", "marquise-cut-diamond-solitaire-ring-in-silver-with-round-shared-prong-pave-band", "Engagement rings"], ["Trillion Bezel-Set Solitaire Studs · Silver", 321, "01", "silver-trillion-diamond-bezel-set-solitaire-stud-earrings", "Earrings"], ["Baguette Cluster Studs · Silver", 349, "09", "silver-baguette-diamond-cluster-stud-earrings", "Earrings"], ["Round Basket-Set Studs · Yellow gold", 363, "04", "yellow-gold-round-diamond-basket-set-stud-earrings-with-diamond-accent", "Earrings"], ["Princess Channel Band · Silver", 559, "55", "silver-princess-cut-channel-set-diamond-band-with-bar-prong-setting", "Bands"], ["Trillion Bezel-Set Solitaire Studs · Yellow gold", 573, "00", "yellow-gold-trillion-diamond-bezel-set-solitaire-stud-earrings", "Earrings"], ["Oval Half Halo Studs · Silver", 573, "03", "silver-oval-diamond-half-halo-stud-earrings", "Earrings"], ["Marquise Ivy Climbers · Yellow gold", 573, "07", "yellow-gold-marquise-and-round-diamond-ivy-climber-earrings", "Earrings"], ["Water Lily Drops · Silver", 573, "11", "silver-round-diamond-water-lily-drop-earrings-with-diamond-accents", "Earrings"], ["Seven-Stone Channel Band · Silver", 615, "51", "silver-round-diamond-seven-stone-channel-set-mens-band", "Bands"], ["Hydrangea Open Hoops · Silver", 643, "14", "silver-round-diamond-hydrangea-bouquet-open-hoop-earrings", "Earrings"], ["Oval Solitaire, Pavé Band · White gold", 699, "57", "oval-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band", "Engagement rings"], ["Emerald Solitaire, Pavé Band · White gold", 699, "58", "emerald-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band", "Engagement rings"], ["Radiant Solitaire, Pavé Band · White gold", 699, "59", "radiant-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band", "Engagement rings"], ["Princess Solitaire, Pavé Band · White gold", 699, "61", "princess-cut-diamond-solitaire-ring-in-white-gold-with-round-shared-prong-pave-band", "Engagement rings"], ["Baguette Cluster Studs · Yellow gold", 853, "08", "yellow-gold-baguette-diamond-cluster-stud-earrings", "Earrings"], ["Mosaic Hoops · Yellow gold", 895, "12", "yellow-gold-round-diamond-mosaic-hoop-earrings", "Earrings"], ["Oval & Baguette Drop Pendant · Silver", 895, "20", "silver-oval-and-baguette-diamond-drop-pendant", "Necklaces"], ["Water Lily Drops · Yellow gold", 937, "10", "yellow-gold-round-diamond-water-lily-drop-earrings-with-diamond-accents", "Earrings"], ["Oval Half Halo Studs · Yellow gold", 951, "02", "yellow-gold-oval-diamond-half-halo-stud-earrings", "Earrings"], ["Princess Channel Band · Yellow gold", 1077, "54", "yellow-gold-princess-cut-channel-set-diamond-band-with-bar-prong-setting", "Bands"], ["Woven Full Eternity Band · Silver", 1133, "45", "silver-round-diamond-woven-full-eternity-band", "Bands"], ["Pear Solitaire, Pavé Band · Platinum", 1189, "60", "pear-cut-diamond-solitaire-ring-in-platinum-with-round-shared-prong-pave-band", "Engagement rings"], ["Oval Bezel Eternity Band · Silver", 1301, "49", "silver-oval-diamond-bezel-set-eternity-wedding-band", "Bands"], ["Heart Station Necklace · Yellow gold", 1315, "26", "yellow-gold-heart-and-round-diamond-station-necklace", "Necklaces"], ["East-West Emerald Tennis Bracelet · Silver", 1329, "33", "silver-east-west-emerald-cut-diamond-tennis-bracelet-with-bezel-setting", "Bracelets"], ["Oval Floral Halo Pendant · Silver", 1413, "18", "silver-oval-diamond-floral-halo-pendant-with-diamond-accents", "Necklaces"], ["Bezel Round Drop Necklace · Silver", 1665, "22", "silver-round-diamond-drop-necklace-with-bezel-setting", "Necklaces"], ["Oval & Baguette Drop Pendant · Yellow gold", 1679, "19", "yellow-gold-oval-and-baguette-diamond-drop-pendant", "Necklaces"], ["Emerald Half-Bezel Tennis Bracelet · Silver", 1693, "29", "silver-emerald-cut-diamond-tennis-bracelet-with-half-bezel-setting", "Bracelets"], ["Round Tennis Necklace · Silver", 1735, "16", "silver-round-diamond-tennis-necklace-with-three-prong-setting", "Necklaces"], ["Oval Floral Halo Studs · Platinum", 1763, "06", "platinum-oval-diamond-floral-halo-stud-earrings", "Earrings"], ["Woven Full Eternity Band · Yellow gold", 1861, "44", "yellow-gold-round-diamond-woven-full-eternity-band", "Bands"], ["Triangle Geometric Band · Silver", 1931, "53", "silver-triangle-diamond-geometric-mens-band", "Bands"], ["Emerald Bezel Tennis Bracelet · Silver", 1987, "31", "silver-emerald-cut-diamond-tennis-bracelet-with-bezel-setting", "Bracelets"], ["Seven-Stone Channel Band · Yellow gold", 2029, "50", "yellow-gold-round-diamond-seven-stone-channel-set-mens-band", "Bands"], ["Bezel Round Tennis, Radiant Centre · Silver", 2113, "39", "silver-bezel-set-round-diamond-tennis-bracelet-with-radiant-center-diamond", "Bracelets"], ["Mixed-Shape Bezel Eternity Band · Silver", 2127, "47", "silver-mixed-shape-diamond-bezel-set-eternity-wedding-band", "Bands"], ["Milgrain Box Tennis Bracelet · Silver", 2183, "41", "silver-round-cut-milgrain-tennis-bracelet-with-box-setting", "Bracelets"], ["Marquise Riviera Necklace · Silver", 2379, "24", "silver-marquise-diamond-riviera-necklace", "Necklaces"], ["Emerald Four-Prong Tennis Bracelet · Silver", 2435, "37", "silver-emerald-cut-diamond-tennis-bracelet-with-four-prong-setting", "Bracelets"], ["Oval Bezel Eternity Band · Yellow gold", 2449, "48", "yellow-gold-oval-diamond-bezel-set-eternity-wedding-band", "Bands"], ["East-West Emerald Tennis Bracelet · Yellow gold", 2491, "32", "yellow-gold-east-west-emerald-cut-diamond-tennis-bracelet-with-bezel-setting", "Bracelets"], ["Oval Floral Halo Pendant · Yellow gold", 2533, "17", "yellow-gold-oval-diamond-floral-halo-pendant-with-diamond-accents", "Necklaces"], ["Halo Circle Link Bracelet · Silver", 2659, "43", "silver-round-cut-diamond-halo-circle-link-bracelet-with-pave-setting", "Bracelets"], ["Baguette Bar-Set Tennis Bracelet · Silver", 2939, "35", "silver-baguette-cut-diamond-bar-set-tennis-bracelet", "Bracelets"], ["Emerald Half-Bezel Tennis Bracelet · Yellow gold", 3051, "28", "yellow-gold-emerald-cut-diamond-tennis-bracelet-with-half-bezel-setting", "Bracelets"], ["Bezel Round Drop Necklace · Yellow gold", 3331, "21", "yellow-gold-round-diamond-drop-necklace-with-bezel-setting", "Necklaces"], ["Milgrain Bezel Tennis Bracelet · Silver", 3541, "42", "silver-round-diamond-tennis-bracelet-with-milgrain-bezel-setting", "Bracelets"], ["Triangle Geometric Band · Yellow gold", 3555, "52", "yellow-gold-triangle-diamond-geometric-mens-band", "Bands"], ["Mixed-Shape Bezel Eternity Band · Yellow gold", 3625, "46", "yellow-gold-mixed-shape-diamond-bezel-set-eternity-wedding-band", "Bands"], ["Emerald Bezel Tennis Bracelet · Yellow gold", 3709, "30", "yellow-gold-emerald-cut-diamond-tennis-bracelet-with-bezel-setting", "Bracelets"], ["Round Tennis Necklace · Yellow gold", 3947, "15", "yellow-gold-round-diamond-tennis-necklace-with-three-prong-setting", "Necklaces"], ["Emerald Four-Prong Tennis Bracelet · Yellow gold", 4213, "36", "yellow-gold-emerald-cut-diamond-tennis-bracelet-with-four-prong-setting", "Bracelets"], ["Emerald Three-Row Eternity Band · Silver", 4409, "56", "silver-emerald-cut-and-round-diamond-three-row-eternity-mens-band", "Bands"], ["Marquise Riviera Necklace · Yellow gold", 4829, "23", "yellow-gold-marquise-diamond-riviera-necklace", "Necklaces"], ["Bezel Round Tennis, Radiant Centre · Yellow gold", 5319, "38", "yellow-gold-bezel-set-round-diamond-tennis-bracelet-with-radiant-center-diamond", "Bracelets"], ["Baguette Bar-Set Tennis Bracelet · Yellow gold", 5599, "34", "yellow-gold-baguette-cut-diamond-bar-set-tennis-bracelet", "Bracelets"], ["Milgrain Box Tennis Bracelet · Yellow gold", 5599, "40", "yellow-gold-round-cut-milgrain-tennis-bracelet-with-box-setting", "Bracelets"]]; // the first designs of every category (2026-11-07): [name, price, image id, handle, category]
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
            <div className="dly-stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={ITEMS[cur][2]} src={`/media/daily/p3/${ITEMS[cur][2]}.webp`} alt={ITEMS[cur][0]} />
            </div>
            <div className="dly-pn">{best >= 0 ? <><em>{ITEMS[cur][4]}</em>{ITEMS[cur][0]} · {usd(ITEMS[cur][1])}</> : `${ITEMS[0][0]} — ${usd(Math.ceil(ITEMS[0][1] / (months * 30)))} a day gets you there`}</div>
            <div className="dly-strip" aria-label="The collection at your price">
              <div className="dly-track" style={{ ["--i" as string]: cur }}>
                {ITEMS.map((x, i) => (
                  <button key={x[2]} type="button" className={`${x[1] > total ? "off" : ""}${i === cur ? " cur" : ""}`} onClick={() => choose(i)} aria-label={`${x[0]}, ${usd(x[1])}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/daily/p3/t${x[2]}.webp`} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
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
