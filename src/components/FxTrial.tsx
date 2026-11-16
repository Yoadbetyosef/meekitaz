"use client";
import { useEffect, useRef, useState } from "react";

/* (2026-11-15) TRIAL — three scroll effects behind one private on/off switch (his picks "1 · 7 · 3" from the scroll-effects preview).
   Only a browser that has opened meekitaz.com/?look=1 sees the switch (?look=0 removes it); it sets html.fx. With the switch off, or
   for every other visitor, nothing here does anything.
     1 · FxLine     — the house line fills with ink, word by word, right after the opening (home).
     3 · (Categories.tsx reads html.fx) — Shop by category locks and its films pass sideways while you scroll down.
     7 · FxCurtain  — our lime squares fill the screen as Fancy colors and the reviews come in, then clear. */
const SHOW = "mk-look-show", KEY = "mk-fx-on";
export const fxOn = () => typeof document !== "undefined" && document.documentElement.classList.contains("fx");

export function FxSwitch() {
  const [show, setShow] = useState(false), [on, setOn] = useState(false);
  const apply = (v: boolean) => { document.documentElement.classList.toggle("fx", v); window.dispatchEvent(new Event("mk-fx")); window.dispatchEvent(new Event("resize")); };
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

const WORDS: [string, boolean][] = [["We", false], ["take", false], ["diamonds", false], ["seriously.", false], ["Life,", true], ["a", true], ["little", true], ["less.", true]];
export function FxLine() {
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const s = sec.current; if (!s) return;
    const ws = Array.from(s.querySelectorAll<HTMLElement>("span")); let raf = 0;
    const draw = () => { raf = 0; if (!fxOn()) return; const r = s.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight))); ws.forEach((w, i) => w.classList.toggle("on", p * 1.2 > i / ws.length)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on); window.addEventListener("mk-fx", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); window.removeEventListener("mk-fx", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="fxl" ref={sec} aria-label="We take diamonds seriously. Life, a little less.">
      <div className="fxl-pin"><p aria-hidden="true">{WORDS.map(([w, it], i) => <span key={i}>{it ? <em>{w}</em> : w} </span>)}</p></div>
    </section>
  );
}

export function FxCurtain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, cx = cv?.getContext("2d"); if (!cv || !cx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hash = (a: number, b: number) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
    let raf = 0, dirty = false;
    const draw = () => {
      raf = 0;
      const H = window.innerHeight; let q = -1;
      if (fxOn()) document.querySelectorAll<HTMLElement>(".home-page .sec.nf, .home-page #reviews").forEach(el => { const v = 1 - el.getBoundingClientRect().top / H; if (v > .12 && v < .88) q = v; });
      if (q < 0) { if (dirty) { cx.clearRect(0, 0, cv.width, cv.height); dirty = false; } return; }
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), Hh = Math.round(cv.clientHeight * dpr);
      if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
      const S = Math.max(W, Hh) / 14, f = Math.max(0, Math.min(1, q < .5 ? (q - .15) / .33 : (.85 - q) / .33));
      cx.clearRect(0, 0, W, Hh); cx.fillStyle = "#E1FF4F"; dirty = true;
      for (let j = 0; j * S < Hh; j++) for (let i = 0; i * S < W; i++) {
        const k = (1 - (j * S) / Hh) * .5 + hash(i + 1, j + 1) * .5; // the squares nearest the incoming section go first
        if (f * 1.15 > (q < .5 ? k : 1 - k)) cx.fillRect(Math.floor(i * S), Math.floor(j * S), Math.ceil(S) + 1, Math.ceil(S) + 1);
      }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on); window.addEventListener("mk-fx", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); window.removeEventListener("mk-fx", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <canvas className="fx-cur" ref={ref} aria-hidden="true" />;
}
