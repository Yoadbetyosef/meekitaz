"use client";
import { useEffect } from "react";

/* The light changes as you scroll (approved 2026-11-09, "L1 · a colour for every chapter", starting on butter): each chapter of the home
   page has its own colour, and the whole page's ground blends from one to the next as you scroll — every section paints var(--home-bg),
   so this only sets that one variable on the page. It ends on the footer's butter, so the footer is the natural last chapter. */
const CHAPTERS = ["#FEF5D9", "#F6DCE5", "#E5E3EF", "#FBF0C6", "#DCE7F7", "#F8EED3", "#F7E1D3", "#EDE4F4", "#F6DCE5", "#FEF5D9"];
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`; };

export default function ChapterLight() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main.home-page"); if (!main) return;
    const list = () => [main.querySelector<HTMLElement>(".hop"), ...Array.from(main.querySelectorAll<HTMLElement>(".over-fun > section"))]
      .filter((el): el is HTMLElement => !!el && el.offsetHeight > 0);
    let secs = list(), raf = 0, last = "";
    const colourFor = (i: number, n: number) => i === n - 1 ? CHAPTERS[CHAPTERS.length - 1] : CHAPTERS[i % (CHAPTERS.length - 1)];
    const paint = () => {
      raf = 0; if (!secs.length) return;
      const mid = window.scrollY + window.innerHeight * .5; let i = 0;
      secs.forEach((s, k) => { if (s.getBoundingClientRect().top + window.scrollY <= mid) i = k; });
      const s = secs[i], top = s.getBoundingClientRect().top + window.scrollY, t = Math.min(1, Math.max(0, (mid - top) / Math.max(1, s.offsetHeight)));
      const b = Math.min(1, Math.max(0, (t - .6) / .4)), e = b * b * (3 - 2 * b);
      const n = secs.length, c = mix(colourFor(i, n), colourFor(Math.min(n - 1, i + 1), n), e);
      if (c !== last) { main.style.setProperty("--home-bg", c); last = c; }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const re = () => { secs = list(); on(); };
    paint(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", re);
    const t = window.setTimeout(re, 1200); // after images and films settle the sections' heights
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", re); window.clearTimeout(t); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
