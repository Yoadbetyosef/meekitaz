"use client";
import { useEffect, useRef, useState } from "react";

/* The "system" layer — a trial, off for everyone. Only a browser that has the private switch (meekitaz.com/?look=1) sees a second
   switch, "System": it adds body.sys2 and this layer comes on over the site as it is —
   lime (#D9F24B) as the signal colour · a status bar along the bottom (the promises rolling, New York's clock, how far down the page) ·
   mono labels that decode themselves as they come into view · a lime dot that trails the pointer · the ticker and the giant
   moving Meekitaz on the home page · the six diamond cuts as a set of signs. Nothing here shows unless the switch is on. */
const SHOW = "mk-look-show", ON = "mk-sys-on", NN = "mk-nn-on";
const MSGS: [string, string][] = [["No", "Loans & interest"], ["No", "Credit checks"], ["No", "Rentals — it’s yours"], ["Yes", "Everyone’s approved"], ["From", "$1 a day"]];
const SCR = ".cf-hd > span, .cf-n, .oo2-top > span, .nf-top > span:first-child, .pa-kick-t, .fb-kick, .sy-cap";
const POOL = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789$#/";

export default function SystemLayer() {
  const [show, setShow] = useState(false), [nn, setNn] = useState(false), [on, setOn] = useState(false), [m, setM] = useState(0), [clock, setClock] = useState("");
  const pct = useRef<HTMLSpanElement>(null), fill = useRef<HTMLElement>(null), cur = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { const s = localStorage.getItem(SHOW) === "1" || new URLSearchParams(location.search).get("look") === "1"; const o = s && localStorage.getItem(ON) === "1"; setShow(s); setOn(o); document.body.classList.toggle("sys2", o); const n = s && localStorage.getItem(NN) === "1"; setNn(n); document.documentElement.classList.toggle("nn", n); } catch { /* private mode */ }
  }, []);
  const flip = () => { const n = !on; setOn(n); document.body.classList.toggle("sys2", n); try { localStorage.setItem(ON, n ? "1" : "0"); } catch { /* ignore */ } };
  // "New New": one colour language for the whole site (bone, stone, ink, lime) — see the end of globals.css
  const flipNn = () => { const n = !nn; setNn(n); document.documentElement.classList.toggle("nn", n); try { localStorage.setItem(NN, n ? "1" : "0"); } catch { /* ignore */ } };
  useEffect(() => {
    if (!on) return;
    const a = window.setInterval(() => setM(x => (x + 1) % MSGS.length), 2200);
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const tick = () => setClock(fmt.format(new Date())); tick(); const b = window.setInterval(tick, 1000);
    const sc = () => { const h = document.documentElement, p = Math.max(0, Math.min(100, Math.round(h.scrollTop / Math.max(1, h.scrollHeight - window.innerHeight) * 100))); if (pct.current) pct.current.textContent = String(p).padStart(3, "0") + "%"; if (fill.current) fill.current.style.width = p + "%"; };
    sc(); window.addEventListener("scroll", sc, { passive: true });
    // mono labels decode themselves the first time they come into view
    const done = new WeakSet<Element>();
    const run = (el: Element) => {
      if (done.has(el) || el.childNodes.length !== 1 || el.firstChild?.nodeType !== 3) return; done.add(el);
      const node = el.firstChild as Text, text = node.data, t0 = performance.now(), D = 520 + text.length * 12;
      const step = (now: number) => { const k = Math.min(1, (now - t0) / D), n = Math.floor(k * text.length); node.data = text.slice(0, n) + text.slice(n).replace(/[^\s·()]/g, () => POOL[Math.floor(Math.random() * POOL.length)]); if (k < 1) requestAnimationFrame(step); else node.data = text; };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
    const scan = () => document.querySelectorAll(SCR).forEach(el => { if (!done.has(el)) io.observe(el); });
    scan(); const c = window.setInterval(scan, 1500);
    // the lime dot trails the pointer and opens up over anything you can press
    let raf = 0, x = -100, y = -100, tx = -100, ty = -100; const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const mv = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; const t = (e.target as Element | null)?.closest?.("a,button,[role=button],input,.cf"); cur.current?.classList.toggle("big", !!t); };
    const loop = () => { x += (tx - x) * .2; y += (ty - y) * .2; if (cur.current) cur.current.style.transform = `translate(${x}px,${y}px)`; raf = requestAnimationFrame(loop); };
    if (fine) { window.addEventListener("pointermove", mv, { passive: true }); raf = requestAnimationFrame(loop); }
    return () => { clearInterval(a); clearInterval(b); clearInterval(c); window.removeEventListener("scroll", sc); io.disconnect(); window.removeEventListener("pointermove", mv); cancelAnimationFrame(raf); };
  }, [on]);
  if (!show) return null;
  return (
    <>
      <button type="button" className={`lk-sw nn-sw${nn ? " on" : ""}`} role="switch" aria-checked={nn} onClick={flipNn}><i aria-hidden="true" /><span>{nn ? "New New · on" : "New New · off"}</span></button>
      <button type="button" className={`lk-sw sy-sw${on ? " on" : ""}`} role="switch" aria-checked={on} onClick={flip}><i aria-hidden="true" /><span>{on ? "System · on" : "System · off"}</span></button>
      {on && <>
        <div className="sy-bar" aria-hidden="true">
          <span className="sy-l">(Meekitaz Daily)</span>
          <span className="sy-mid"><span key={m}><em>{MSGS[m][0]}</em>{MSGS[m][1]}</span></span>
          <span className="sy-r"><span className="sy-clk">New York {clock}</span><span className="sy-prog"><i ref={fill} /></span><span ref={pct}>000%</span></span>
        </div>
        <div className="sy-cur" ref={cur} aria-hidden="true" />
      </>}
    </>
  );
}
