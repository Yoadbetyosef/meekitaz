"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* (2026-11-15) TRIAL — the scroll language he liked on joinmidi.com, behind one private three-way switch (meekitaz.com/?look=1;
   ?look=0 removes it). Off for every other visitor.
     html.md1 "On existing": the lime pixel meter replaces the counters the page already has (Shop by category, Fancy colors). CSS only.
     html.md2 "Added": two new sections — MidiNumber (the daily price counts up while a lime pixel grid fills, with a mono strip
       under it) after the opening, and MidiHeadline (a giant headline the photograph rises behind, turning the letters white where
       it covers them) before One of One. */
const SHOW = "mk-look-show", KEY = "mk-md";
const NAMES = ["FX · off", "FX · on existing", "FX · added"];
const cl = (v: number) => Math.max(0, Math.min(1, v));
const live = () => document.documentElement.classList.contains("md2");

export function MidiSwitch() {
  const [show, setShow] = useState(false), [v, setV] = useState(0);
  const apply = (n: number) => { const c = document.documentElement.classList; c.remove("md1", "md2"); if (n) c.add(`md${n}`); window.dispatchEvent(new Event("scroll")); };
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("look");
      if (q === "1") localStorage.setItem(SHOW, "1");
      if (q === "0") { localStorage.removeItem(SHOW); localStorage.removeItem(KEY); }
      const s = localStorage.getItem(SHOW) === "1", n = s ? Math.max(0, Math.min(2, Number(localStorage.getItem(KEY)) || 0)) : 0;
      setShow(s); setV(n); apply(n);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  return <button type="button" className={`md-sw${v ? " on" : ""}`} onClick={() => { const n = (v + 1) % 3; setV(n); apply(n); try { localStorage.setItem(KEY, String(n)); } catch { /* ignore */ } }}>{NAMES[v]}</button>;
}

const STRIP = ["Free insured shipping", "30-day free returns", "Lifetime warranty", "Lab-grown, graded by IGI or GIA", "From $1 a day"];
export function MidiNumber() {
  const sec = useRef<HTMLElement>(null), num = useRef<HTMLDivElement>(null), tot = useRef<HTMLSpanElement>(null), grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = sec.current; if (!s) return; let raf = 0;
    const draw = () => {
      raf = 0; if (!live()) return;
      const r = s.getBoundingClientRect(), H = window.innerHeight, p = cl(((H - r.top) / (H + r.height) - .25) / .45), v = Math.round(1 + p * 49);
      if (num.current) num.current.textContent = `$${v}`;
      if (tot.current) tot.current.textContent = `$${(v * 120).toLocaleString("en-US")}`;
      grid.current?.querySelectorAll("i").forEach((g, i) => g.classList.toggle("on", i < Math.round(p * 10)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    // phones: the opening is taller than the screen and scrolls away, so nothing could climb over it. While this trial is on, it
    // scrolls until its last screen is showing and then stays put, and this section (with the page below) climbs over it as on computers.
    const hop = document.querySelector<HTMLElement>(".home-page .hop.hop-daily");
    const hold = () => {
      if (!hop) return;
      if (live() && window.matchMedia("(max-width:767px)").matches) { hop.style.setProperty("position", "sticky", "important"); hop.style.top = `${Math.min(0, window.innerHeight - hop.offsetHeight)}px`; }
      else { hop.style.removeProperty("position"); hop.style.top = ""; }
    };
    const re = () => { hold(); on(); };
    hold(); draw(); const late = window.setTimeout(hold, 1500);
    window.addEventListener("scroll", re, { passive: true }); window.addEventListener("resize", re);
    return () => { window.clearTimeout(late); window.removeEventListener("scroll", re); window.removeEventListener("resize", re); if (raf) cancelAnimationFrame(raf); if (hop) { hop.style.removeProperty("position"); hop.style.top = ""; } };
  }, []);
  return (
    <section className="mdn" ref={sec} aria-label="Meekitaz Daily">
      <div className="mdn-ph">
        <div className="mdn-n" ref={num}>$1</div>
        <p>a day. Yours, up to <span ref={tot}>$120</span>, in up to 4 months.</p>
        <div className="mdn-g" ref={grid} aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</div>
      </div>
      <div className="mdn-st" aria-hidden="true"><div>{[0, 1, 2, 3].map(k => STRIP.map(t => <span key={`${k}${t}`}>{t}</span>))}</div></div>
    </section>
  );
}

export function MidiHeadline() {
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const s = sec.current; if (!s) return;
    const q = (c: string) => s.querySelector<HTMLElement>(c)!; let raf = 0;
    const draw = () => {
      raf = 0; if (!live()) return;
      // timed in screens scrolled (d), not as a share of the section, so the opening keeps its pace whatever the section's length:
      // the photo rises over the first .66 of a screen, the words follow, and it fades out completely over the last .3 before the end
      const r = s.getBoundingClientRect(), H = window.innerHeight, d = Math.max(0, -r.top) / H, end = Math.max(.1, r.height / H - 1), y = (1 - cl(d / .66)) * H, w = q(".mdh-w");
      q(".mdh-im").style.transform = `translate3d(0,${y}px,0)`;
      w.style.clipPath = `inset(${Math.max(0, y - w.offsetTop)}px 0 0 0)`;
      q(".mdh-sub").style.opacity = String(cl((d - .7) / .18));
      q(".mdh-card").style.opacity = String(cl((d - .88) / .18));
      q(".mdh-txt").style.opacity = String(cl((d - 1.01) / .18));
      q(".mdh-wash").style.opacity = String(cl((d - (end - .32)) / .3));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="mdh" ref={sec} aria-label="Serious diamonds, worn lightly.">
      <div className="mdh-pin">
        <p className="mdh-big" aria-hidden="true"><span>Serious</span><span>diamonds</span></p>
        <div className="mdh-im" />
        <p className="mdh-big mdh-w" aria-hidden="true"><span>Serious</span><span>diamonds</span></p>
        <p className="mdh-sub">Worn lightly.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="mdh-card" aria-hidden="true"><img src="/media/intro/d0.png" alt="" loading="lazy" /></div>
        <p className="mdh-txt">Lipstick first. Ring always. <Link href="/engagement-rings">Shop engagement rings &rarr;</Link></p>
        <div className="mdh-wash" />
      </div>
    </section>
  );
}
