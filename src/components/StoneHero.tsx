"use client";
/* (approved 2026-11-14, "A") A diamond chosen first is presented in the Engagement Rings hero — "Rings for your emerald." —
 * slowly turning on a white disc. Scrolling flies it up into the menu pill (NavJewel), where it stays on every page. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clearStone, type Stone } from "@/lib/setting";
import { useStone } from "./StoneBar";
import { DailyHeroBadge } from "./DailyPrice";
import { stonePicture } from "@/lib/stonePicture";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const shapeOf = (s: Stone) => (s.shape === "Elongated Cushion" ? "Cushion" : s.shape);
const stoneHref = (s: Stone) => `/diamonds/${s.vendor}-${encodeURIComponent(s.stock)}`;
const changeHref = (s: Stone) => `/diamonds?style=${encodeURIComponent(shapeOf(s))}`;

/** (2026-11-14) our own clear render of the shape, not the supplier photo with its grey backdrop */
export function Disc({ s }: { s: Stone }) {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <span className="sj-disc"><img src={stonePicture(s.shape)} alt="" /></span>;
}

export default function StoneHero() {
  const s = useStone();
  const stage = useRef<HTMLDivElement>(null);
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  // the rings below follow the diamond's shape
  useEffect(() => {
    if (!s || s.fancy || sp.get("style")) return;
    const q = new URLSearchParams(sp.toString()); q.set("style", shapeOf(s));
    router.replace(`${path}?${q}`, { scroll: false });
  }, [s, sp, path, router]);
  useEffect(() => {
    if (!s) return;
    document.body.classList.add("mk-stone-rings");
    const hero = document.querySelector(".cat-hero") as HTMLElement | null;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = stage.current; if (!el || !hero) return;
        const h = Math.max(280, hero.offsetHeight * 0.6), p = Math.min(1, Math.max(0, window.scrollY / h));
        el.style.transform = `translate(${p * (window.innerWidth > 767 ? 180 : 40)}px, ${-p * (window.innerWidth > 767 ? 160 : 110)}px) scale(${1 - p * 0.85})`;
        el.style.opacity = String(1 - p);
        document.body.classList.toggle("mk-stone-docked", p > 0.9);
      });
    };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); document.body.classList.remove("mk-stone-rings", "mk-stone-docked"); };
  }, [s]);
  if (!s || s.fancy) return null;
  const grade = [s.color, s.clarity].filter(Boolean).join(" · ");
  return (
    <div className="sth">
      <div className="wrap sth-wrap">
        <h1><small>Your diamond · now its ring</small>Rings for<br />your {shapeOf(s).toLowerCase()}.</h1>
        <p className="sth-sub">{s.carat.toFixed(2)} ct{grade ? ` · ${grade}` : ""} — every ring here fits it.</p>
        <DailyHeroBadge />
      </div>
      <div className="sth-stage" ref={stage}>
        <i className="sth-glow" />
        {[0, 1, 2, 3, 4].map(k => <i key={k} className={`sth-spark k${k}`} />)}
        <Link href={stoneHref(s)} aria-label="View your diamond"><Disc s={s} /></Link>
        <span className="sth-tag">{s.carat.toFixed(2)} ct {s.shape} · <Link href={changeHref(s)}>Change</Link></span>
      </div>
    </div>
  );
}

/** The diamond as a small jewel in the menu pill; tap for View · Change · Remove. */
export function NavJewel() {
  const s = useStone(), path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  // (2026-11-14) only where it belongs: the Engagement Rings page, once the hero's diamond has flown up into the menu
  if (!s || s.fancy || path !== "/engagement-rings") return null;
  const onRings = true;
  return (
    <span className={`sj${onRings ? " sj-rings" : ""}`}>
      <button type="button" className="sj-btn" aria-label="Your diamond" aria-expanded={open} onClick={() => setOpen(o => !o)}><Disc s={s} /></button>
      {open && (
        <span className="sj-drop" role="dialog" aria-label="Your diamond">
          <small>Your diamond</small>
          <span className="sj-row"><Disc s={s} /><span><b>{s.carat.toFixed(2)} ct {s.shape}</b><em>{[s.color, s.clarity, s.lab].filter(Boolean).join(" · ")} · {usd(s.price)}</em></span></span>
          <span className="sj-p">Every engagement ring in its shape fits it. Choose one and see them together.</span>
          <span className="sj-acts">
            <Link href={stoneHref(s)}>View</Link>
            <Link href={`/engagement-rings?style=${encodeURIComponent(shapeOf(s))}`}>Its rings</Link>
            <Link href={changeHref(s)}>Change</Link>
            <button type="button" onClick={() => { clearStone(); setOpen(false); }}>Remove</button>
          </span>
        </span>
      )}
    </span>
  );
}
