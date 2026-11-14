"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* Home · Shop by category — "the films" (approved 2026-11-14). A thin rule with "Shop by category (08)", the line
   "Serious diamonds, worn lightly." and one row of eight film cards that slides sideways: each category's own film plays
   while its card is on screen, with its number and label, its name in large type and our line in italic. A counter, marks
   and arrows underneath (phones just swipe). The poster tiles this replaces are archived as design/home-shop-by-category-tiles. */
const FILMS: { href: string; title: string; sub: string; lab: string; film?: string; img?: string; pos?: string }[] = [
  { href: "/engagement-rings", title: "Engagement rings", sub: "One stone. The whole conversation.", lab: "The rings", film: "rings-film" },
  { href: "/diamonds", title: "Diamonds", sub: "Loose stones, serious sizes.", lab: "The stones", film: "daily/hero" },
  { href: "/earrings", title: "Earrings", sub: "A ball cap. Two carats.", lab: "The studs", film: "earrings-film" },
  { href: "/necklaces", title: "Necklaces", sub: "Layered. Then layered again.", lab: "The neck", film: "necklaces-film" },
  { href: "/bracelets", title: "Bracelets", sub: "Stacked for breakfast.", lab: "The wrist", film: "bracelets-film" },
  { href: "/bands", title: "Bands", sub: "The one you never take off.", lab: "The bands", film: "bands-film" },
  { href: "/fancy-colors", title: "Fancy colors", sub: "Pink is a neutral.", lab: "The colours", film: "fancy-film" },
  { href: "/one-of-one", title: "One of One", sub: "Made once. Never again.", lab: "Made once", img: "/media/home/one-of-one-scarf.webp", pos: "50% 22%" }, // no film of its own yet
];
const p2 = (n: number) => String(n).padStart(2, "0");
// computers play the wide cut, phones the tall one (the Diamonds clip has one cut)
const src = (f: string, wide: boolean) => f === "daily/hero" ? { v: "/media/daily/hero.mp4", p: "/media/daily/hero.jpg" }
  : wide ? { v: `/media/${f}-desktop.mp4`, p: `/media/${f}-desktop-poster.jpg` } : { v: `/media/${f}.mp4`, p: `/media/${f}-poster.jpg` };

export default function Categories() {
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0), [wide, setWide] = useState(true);
  useEffect(() => { const m = window.matchMedia("(min-width:768px)"), f = () => setWide(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  useEffect(() => {
    const el = row.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(x => {
      const v = x.target as HTMLVideoElement;
      if (x.isIntersecting) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => { /* autoplay refused: the poster stays */ }); } else v.pause();
    }), { threshold: 0.4 });
    el.querySelectorAll("video").forEach(v => io.observe(v));
    return () => io.disconnect();
  }, [wide]);
  const step = () => { const el = row.current, c = el?.querySelector<HTMLElement>(".cf"); return el && c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "16") : 0; };
  const go = (d: number) => row.current?.scrollBy({ left: d * step(), behavior: "smooth" });
  const onScroll = () => { const el = row.current, s = step(); if (el && s) setAt(Math.min(FILMS.length - 1, Math.round(el.scrollLeft / s))); };
  return (
    <section className="sec cfs" id="shop" aria-label="Shop by category">
      <div className="cf-hd"><span>Shop by category</span><span>({p2(FILMS.length)})</span></div>
      <h2 className="cf-h">Serious diamonds,<em>worn lightly.</em></h2>
      <div className="cf-row" ref={row} onScroll={onScroll}>
        {FILMS.map((t, i) => {
          const s = t.film ? src(t.film, wide) : null;
          return (
            <Link key={t.href} href={t.href} className="cf">
              <span className="cf-clip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s ? <video key={s.v} data-src={s.v} poster={s.p} muted loop playsInline preload="none" aria-hidden="true" /> : <img src={t.img} alt="" loading="lazy" style={{ objectPosition: t.pos }} />}
                <span className="cf-n">{p2(i + 1)} · {t.lab}</span>
                <span className="cf-go" aria-hidden="true">&rarr;</span>
                <span className="cf-t"><b>{t.title}</b><i>{t.sub}</i></span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="cf-bar">
        <span className="cf-cnt">{p2(at + 1)} / {p2(FILMS.length)}</span>
        <span className="cf-dots" aria-hidden="true">{FILMS.map((_, i) => <i key={i} className={i === at ? "on" : ""} />)}</span>
        <span className="cf-ar"><button type="button" aria-label="Previous category" onClick={() => go(-1)}>&larr;</button><button type="button" aria-label="Next category" onClick={() => go(1)}>&rarr;</button></span>
      </div>
    </section>
  );
}
