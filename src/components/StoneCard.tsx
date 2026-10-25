"use client";
import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveStone } from "@/lib/setting";

export type Item = { fancy: string | null; id: string; vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null; cut: string | null; lab: string; image: string; embed: string | null; price: number };
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const isTouch = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

export default function StoneCard({ d, playing, setPlaying, onOpen, pick }: { d: Item; playing: boolean; setPlaying: (id: string | null) => void; onOpen: () => void; pick?: number }) {
  const router = useRouter();
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => { if (t.current) clearTimeout(t.current); t.current = null; };
  return (
    <div className={`dcard-wrap${pick ? " ai-pick" : ""}`}>
    {pick ? <span className="ai-rib" aria-label={`Top 3 AI pick number ${pick}`}><i>{pick}</i><b>✦</b> Top 3 AI pick</span> : null}
    <Link href={`/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}`} className={`pcard dcard${playing ? " playing" : ""}`} onClick={e => { if (!e.defaultPrevented) onOpen(); }}>
      <div
        className="pcard-img"
        // desktop: hover plays the 360 video in place. On phones the video lives on the stone page.
        onMouseEnter={() => { if (d.embed && !isTouch()) { stop(); t.current = setTimeout(() => setPlaying(d.id), 220); } }}
        onMouseLeave={() => { if (!isTouch()) { stop(); setPlaying(null); } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.image} alt={`${d.carat.toFixed(2)} carat ${d.shape} diamond`} loading="lazy" referrerPolicy="no-referrer" />
        {d.embed && !playing && <span className="b360">360°</span>}
        {playing && d.embed && <div className="vw"><iframe src={d.embed} title={`360° view of ${d.carat.toFixed(2)} carat ${d.shape}`} scrolling="no" allow="autoplay" /></div>}
      </div>
      <div className="pcard-txt"><b>{d.carat.toFixed(2)} ct {d.shape}</b><p>{(d.fancy ? [d.fancy, d.clarity, d.lab] : [d.color, d.clarity, d.cut ? d.cut + " cut" : null, d.lab]).filter(Boolean).join(" · ")}</p><span className="price">{usd(d.price)}</span></div>
    </Link>
    <button type="button" className="dcard-cta" onClick={() => { saveStone({ vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, lab: d.lab, image: d.image, price: d.price, fancy: d.fancy }); onOpen(); router.push(`/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}`); }}>Choose this diamond</button>
    </div>
  );
}

