"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WishHeart from "@/components/WishHeart";
import type { ReelItem } from "@/lib/shopify";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const MATS = ["#F7D3DA", "#F7E9A8", "#DCEBF4", "#DDE6CF", "#EFC5CA", "#E4E8EC"];
type Mood = { at: number; img: string; tag: string; l1: string; l2: string };
const MOODS: Mood[] = [
  { at: 4, img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_005300_520e34ad-6539-4260-82ac-59d4202aeb20.png", tag: "Ready to ship", l1: "Pack light.", l2: "Wear the yellow." },
  { at: 11, img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261018_013055_5d071409-989e-4bfe-9770-4fbaf0874ed1.png", tag: "In stock now", l1: "Ask tonight.", l2: "Not in six weeks." },
];

/* Ready to Ship · design C ("night & day"): the black films stay black and dramatic, each card carries a thin band and a tag in one of
   our colours, and two fashion blocks break the grid. The film plays on hover (desktop) or when the card is in view (phone). */
function Card({ it, k }: { it: ReelItem; k: number }) {
  const v = useRef<HTMLVideoElement>(null), box = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = box.current, vid = v.current; if (!el || !vid) return;
    vid.muted = true; vid.defaultMuted = true;
    if (!window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }, { threshold: 0.75 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const [ct, rest] = [it.title.split(" · ")[1] || "", it.title.split(" · ")[0]];
  return (
    <Link ref={box} href={`/products/${it.handle}`} className="rts-card" style={{ ["--mat" as string]: MATS[k % MATS.length] }}
      onMouseEnter={() => v.current?.play().catch(() => {})} onMouseLeave={() => v.current?.pause()}>
      <div className="rts-media">
        <span className="rts-tag">Ready to ship</span>
        <span className="rts-heart" onClick={e => e.preventDefault()}><WishHeart item={{ handle: it.handle, title: it.title, image: it.image || "", price: it.price, compareAt: it.compare || null }} /></span>
        {it.image && <img src={it.image} alt={it.title} loading={k < 6 ? "eager" : "lazy"} />}
        {it.video && <video ref={v} src={it.video} muted loop playsInline preload="none" />}
      </div>
      <div className="rts-meta"><div><b>{rest}</b><span>{ct ? `${ct} · ` : ""}lab-grown</span></div><em>{usd(it.price)}</em></div>
    </Link>
  );
}

export default function RtsGrid({ initial, hasNext: h0, cursor: c0, type, sort: s0 }: { initial: ReelItem[]; hasNext: boolean; cursor: string | null; type: string; sort: string }) {
  const [items, setItems] = useState(initial), [hasNext, setHasNext] = useState(h0), [cursor, setCursor] = useState(c0), [busy, setBusy] = useState(false), [sort, setSort] = useState(s0);
  const load = async (after: string | null, s = sort, append = true) => {
    setBusy(true);
    const r = await fetch(`/api/reel?first=24&sort=${s}${type ? `&type=${type}` : ""}${after ? `&after=${encodeURIComponent(after)}` : ""}`).then(x => x.json()).catch(() => null);
    if (r) { setItems(x => append ? [...x, ...r.items] : r.items); setHasNext(r.hasNext); setCursor(r.cursor); }
    setBusy(false);
  };
  const cells: React.ReactNode[] = [];
  items.forEach((it, k) => {
    const m = MOODS.find(x => x.at === k);
    if (m) cells.push(<div key={"m" + k} className="rts-mood"><img src={m.img} alt="" loading="lazy" /><div><small>{m.tag}</small><h3>{m.l1}<em>{m.l2}</em></h3></div></div>);
    cells.push(<Card key={it.handle} it={it} k={k} />);
  });
  return (
    <section className="rts-grid-wrap" id="results">
      <div className="wrap">
        <div className="rts-head"><h2>Ready to ship.</h2>
          <label className="dsort">Sort<select value={sort} onChange={e => { setSort(e.target.value); load(null, e.target.value, false); }}>
            <option value="new">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select></label>
        </div>
        <div className="rts-grid">{cells}</div>
        {hasNext && <div className="dmore"><button type="button" onClick={() => load(cursor)} disabled={busy}>{busy ? "Loading…" : "Show more"}</button></div>}
      </div>
    </section>
  );
}
