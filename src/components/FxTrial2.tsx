"use client";
import { useEffect, useRef, useState } from "react";

/* (2026-11-15) TRIAL 2 — two gentle scroll effects behind one private on/off switch (his picks "6 and 1" from the second preview).
   Only a browser that has opened meekitaz.com/?look=1 sees the switch (?look=0 removes it); it sets html.fx2. With the switch off, or
   for every other visitor, nothing here does anything and nothing on the page is touched.
     1 · FxRise — the home page's big headings rise line by line from behind a hidden edge as they come into view, and the pictures
         move slowly inside their own frames. Nothing locks, nothing gets longer.
     6 · FxBird — the swallow with the pink box crosses the screen as three sections come in (Floating, One of One, the reviews);
         she already lands on "Shhh." in the footer. */
const SHOW = "mk-look-show", KEY = "mk-fx2-on";
const isOn = () => document.documentElement.classList.contains("fx2");

export function FxSwitch2() {
  const [show, setShow] = useState(false), [on, setOn] = useState(false);
  const apply = (v: boolean) => { document.documentElement.classList.toggle("fx2", v); window.dispatchEvent(new Event("mk-fx2")); };
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("look");
      if (q === "1") localStorage.setItem(SHOW, "1");
      if (q === "0") { localStorage.removeItem(SHOW); localStorage.removeItem(KEY); }
      const s = localStorage.getItem(SHOW) === "1", v = s && localStorage.getItem(KEY) === "1";
      setShow(s); setOn(v); if (v) apply(true);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  return <button type="button" className={`fx-sw${on ? " on" : ""}`} aria-pressed={on} onClick={() => { const v = !on; setOn(v); apply(v); try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ } }}>Scroll FX · {on ? "on" : "off"}</button>;
}

const HEADS = ".home-page .cfs .cf-h, .home-page .mkfilm.fl .fl-txt h2, .home-page #reviews h2.h2, .home-page .pc-body h2";
const BLOCKS = ".home-page .nf .nf-h"; // its words change as the colours flood in, so it rises as one piece
const PICS = ".home-page .cf-clip video, .home-page .cf-clip img, .home-page .rv-img img, .home-page .pc-img img";

export function FxRise() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const saved = new Map<HTMLElement, string>(); let io: IntersectionObserver | null = null, raf = 0, pics: HTMLElement[] = [];
    // every word gets its own little window; words on the same line rise together, each line a beat after the one above
    const split = (el: HTMLElement) => {
      saved.set(el, el.innerHTML);
      const walk = (n: Node) => {
        Array.from(n.childNodes).forEach(c => {
          if (c.nodeType === 3) {
            const f = document.createDocumentFragment();
            (c.textContent || "").split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(" ")); return; } const o = document.createElement("span"), i = document.createElement("span"); o.className = "fxw"; i.textContent = w; o.appendChild(i); f.appendChild(o); });
            n.replaceChild(f, c);
          } else if (c.nodeType === 1 && (c as HTMLElement).tagName !== "BR") walk(c);
        });
      };
      walk(el); el.classList.add("fxr");
    };
    const delays = () => saved.forEach((_, el) => { const tops: number[] = []; el.querySelectorAll<HTMLElement>(".fxw").forEach(w => { const t = Math.round(w.getBoundingClientRect().top); let k = tops.findIndex(v => Math.abs(v - t) < 6); if (k < 0) { tops.push(t); k = tops.length - 1; } (w.firstElementChild as HTMLElement).style.transitionDelay = `${k * 90}ms`; }); });
    const draw = () => { raf = 0; const H = window.innerHeight; pics.forEach(p => { const r = (p.parentElement as HTMLElement).getBoundingClientRect(); if (r.bottom < -100 || r.top > H + 100) return; const t = Math.max(0, Math.min(1, (H - r.top) / (H + r.height))); p.style.transform = `translate3d(0,${((t - .5) * 12).toFixed(2)}%,0) scale(1.16)`; }); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const off = () => {
      io?.disconnect(); io = null; saved.forEach((html, el) => { el.innerHTML = html; el.classList.remove("fxr", "fx-in"); }); saved.clear();
      document.querySelectorAll<HTMLElement>(BLOCKS).forEach(el => el.classList.remove("fxb", "fx-in"));
      pics.forEach(p => { p.style.transform = ""; }); pics = []; window.removeEventListener("scroll", onScroll);
    };
    const setup = () => {
      off(); if (!isOn()) return;
      io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("fx-in", e.isIntersecting)), { threshold: .3 });
      document.querySelectorAll<HTMLElement>(HEADS).forEach(el => { split(el); io!.observe(el); });
      document.querySelectorAll<HTMLElement>(BLOCKS).forEach(el => { el.classList.add("fxb"); io!.observe(el); });
      delays(); pics = Array.from(document.querySelectorAll<HTMLElement>(PICS));
      window.addEventListener("scroll", onScroll, { passive: true }); draw();
    };
    const late = window.setTimeout(setup, 600); let rz = 0;
    const onResize = () => { window.clearTimeout(rz); rz = window.setTimeout(delays, 200); };
    window.addEventListener("mk-fx2", setup); window.addEventListener("resize", onResize);
    return () => { window.clearTimeout(late); window.clearTimeout(rz); window.removeEventListener("mk-fx2", setup); window.removeEventListener("resize", onResize); off(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}

const SEAMS = ".home-page .mkfilm.fl, .home-page .oo2, .home-page #reviews";
export function FxBird() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = ref.current; if (!b) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, ft = 0, last = 0, shown = false;
    const hide = () => { if (shown) { b.style.visibility = "hidden"; shown = false; } };
    const tick = (now: number) => {
      raf = 0;
      if (!isOn()) { hide(); return; }
      const H = window.innerHeight, W = window.innerWidth, bw = b.offsetWidth, bh = b.offsetHeight; let top = -1, q = -1;
      document.querySelectorAll<HTMLElement>(SEAMS).forEach(el => { const y = el.getBoundingClientRect().top, v = 1 - y / H; if (v > .18 && v < .82) { top = y; q = v; } });
      if (q < 0) { hide(); return; }
      // she rides the line between the two sections, in from the left and out to the right, with a small rise in the middle
      const at = (v: number) => { const t = Math.max(0, Math.min(1, (v - .2) / .6)); return [-bw + (W + bw * 2) * t, top - bh * .55 - Math.sin(t * Math.PI) * H * .1]; };
      const [x, y] = at(q), [x2, y2] = at(q + .01);
      b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(Math.atan2(y2 - y, x2 - x) * 60 / Math.PI).toFixed(1)}deg)`;
      if (!shown) { b.style.visibility = "visible"; shown = true; }
      ft += Math.min(.05, (now - last) / 1000) * 12; last = now; b.style.backgroundPosition = `${((Math.floor(ft) % 12) / 11) * 100}% 0`;
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    window.addEventListener("scroll", kick, { passive: true }); window.addEventListener("mk-fx2", kick);
    return () => { window.removeEventListener("scroll", kick); window.removeEventListener("mk-fx2", kick); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="fx-bird" ref={ref} aria-hidden="true" />;
}
