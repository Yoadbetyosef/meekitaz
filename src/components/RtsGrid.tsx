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
/* Shopify's CDN resizes on the fly: the supplier's photos are multi-megabyte PNGs, a card needs ~600px */
const sized = (u: string | null | undefined, w: number) => !u ? "" : u.includes("cdn.shopify.com") ? `${u}${u.includes("?") ? "&" : "?"}width=${w}` : u;

/* Only ONE film plays (and downloads) at a time. The supplier's films are big and come from a slow server; letting every card in view
   play at once froze the page. A film starts only after its card has settled in view (or been hovered) for a moment, and a film that
   stops is unloaded so its download is cancelled too. */
let current: HTMLVideoElement | null = null;
function stopFilm(v: HTMLVideoElement | null) { if (!v) return; v.pause(); if (v.getAttribute("src")) { v.removeAttribute("src"); v.load(); } if (current === v) current = null; }
function startFilm(v: HTMLVideoElement) { if (current && current !== v) stopFilm(current); current = v; if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src; v.muted = true; v.play().catch(() => {}); }

function Card({ it, k }: { it: ReelItem; k: number }) {
  const v = useRef<HTMLVideoElement>(null), box = useRef<HTMLAnchorElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false); // the photo stays until the film is really playing — never a black square
  const later = (fn: () => void, ms: number) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(fn, ms); };
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => {
    const el = box.current, vid = v.current; if (!el || !vid) return;
    if (!window.matchMedia("(hover: none)").matches) return () => { cancel(); stopFilm(vid); };
    // phones: the card most in view plays, once scrolling has paused on it for 700 ms
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.75) later(() => startFilm(vid), 700);
      else { cancel(); stopFilm(vid); }
    }, { threshold: [0, 0.75] });
    io.observe(el); return () => { io.disconnect(); cancel(); stopFilm(vid); };
  }, []);
  const [ct, rest] = [it.title.split(" · ")[1] || "", it.title.split(" · ")[0]];
  return (
    <Link ref={box} href={`/products/${it.handle}`} className="rts-card" style={{ ["--mat" as string]: MATS[k % MATS.length] }}
      onMouseEnter={() => { const vid = v.current; if (vid) later(() => startFilm(vid), 220); }} onMouseLeave={() => { cancel(); stopFilm(v.current); }}>
      <div className="rts-media">
        <span className="rts-tag">Ready to ship</span>
        <span className="rts-heart" onClick={e => e.preventDefault()}><WishHeart item={{ handle: it.handle, title: it.title, image: it.image || "", price: it.price, compareAt: it.compare || null }} /></span>
        {it.image && <img src={sized(it.image, 640)} alt={it.title} loading={k < 6 ? "eager" : "lazy"} decoding="async" />}
        {it.video && <video ref={v} className={playing ? "on" : ""} data-src={it.video} poster={sized(it.image, 640) || undefined} muted loop playsInline preload="none" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onEmptied={() => setPlaying(false)} />}
        {it.video && !playing && <span className="rts-play" aria-hidden="true" onClick={e => { e.preventDefault(); if (v.current) startFilm(v.current); }}><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>}
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
