"use client";
import { useEffect, useState } from "react";

/** A private preview switcher for button colours, live on the real site. It only appears after visiting any page with ?cta=1
 *  (and goes away with ?cta=0). The choice is kept in this browser's session only; nobody else sees it. */
type Opt = { n: string; bg: string; fg: string; bd?: string; blur?: number; wipe?: string; wfg?: string };
const HERO: Opt[] = [
  { n: "Pale blue (today)", bg: "#C4DEEE", fg: "#1C1A1B" }, { n: "Butter", bg: "#F7E9A8", fg: "#1C1A1B" }, { n: "Blush pink", bg: "#F7D3DA", fg: "#1C1A1B" },
  { n: "Footer rose", bg: "#EFC5CA", fg: "#1C1A1B" }, { n: "Cream", bg: "#FBF7F1", fg: "#1C1A1B" },
  { n: "Frosted glass", bg: "rgba(255,255,255,.38)", fg: "#1C1A1B", bd: "rgba(255,255,255,.8)", blur: 12 }, { n: "Red", bg: "#7E0508", fg: "#fff" }, { n: "Ink", bg: "#1C1A1B", fg: "#fff" },
];
const CTA: Opt[] = [
  { n: "Today (red)", bg: "#7E0508", fg: "#fff" },
  { n: "Red glass", bg: "rgba(126,5,8,.72)", fg: "#fff", bd: "rgba(255,255,255,.28)", blur: 12, wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Cherry", bg: "#B3141F", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Rosewood", bg: "#9B2C3A", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Raspberry", bg: "#C2354F", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Coral pop", bg: "#F2545B", fg: "#1C1A1B", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Rose", bg: "#E9A1B0", fg: "#1C1A1B", wipe: "#7E0508", wfg: "#fff" },
  { n: "Blush glass", bg: "rgba(247,211,218,.68)", fg: "#1C1A1B", bd: "rgba(255,255,255,.8)", blur: 12, wipe: "#7E0508", wfg: "#fff" },
  { n: "Red → pink", bg: "linear-gradient(110deg,#7E0508,#C2354F 70%,#E9A1B0)", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Outline red", bg: "transparent", fg: "#7E0508", bd: "#7E0508", wipe: "#7E0508", wfg: "#fff" },
  { n: "Tinted glass", bg: "rgba(190,30,45,.55)", fg: "#fff", bd: "rgba(255,255,255,.4)", blur: 14, wipe: "#7E0508", wfg: "#fff" },
  { n: "Ink", bg: "#1C1A1B", fg: "#fff", wipe: "#7E0508", wfg: "#fff" },
];
const HOVER = [["off", "None (today)"], ["wipe", "Fill wipe"], ["arrow", "Arrow slides in"]] as const;
const SEL = [".pill", ".mkfilm-txt .pill", ".pc-form button", ".pc-next", ".cd-empty a", ".cd-co", ".pp-add", ".dcard-cta", ".dd-choose", ".nf-cta", ".sl-all", ".sq-all", ".lr-go", ".hush-cta"];
const HERO_SEL = ".heroc .pill";
const blur = (o: Opt) => (o.blur ? `backdrop-filter:blur(${o.blur}px);-webkit-backdrop-filter:blur(${o.blur}px);` : "");
const look = (o: Opt) => `background:${o.bg} !important;color:${o.fg} !important;border:1px solid ${o.bd || "transparent"} !important;${blur(o)}`;

function build(h: number, c: number, hv: string) {
  let out = "";
  const group = SEL.join(",");
  if (c > 0) out += `${group}{${look(CTA[c])}}`;
  if (c > 0 || h > 0) out += `@media(min-width:768px){${HERO_SEL}{${look(HERO[h])}}}`;
  const o = CTA[c], all = `${group},${HERO_SEL}`, w = o.wipe || "#1C1A1B", wf = o.wfg || "#fff";
  const pre = (s: string, x: string) => s.split(",").map(t => t + x).join(",");
  if (hv === "wipe") out += `${all}{position:relative;overflow:hidden;isolation:isolate}${pre(all, "::before")}{content:"";position:absolute;inset:-1px;background:${w};transform:translateY(102%);transition:transform .45s cubic-bezier(.6,0,.2,1);z-index:-1;pointer-events:none}${pre(all, ":hover::before")}{transform:none}${pre(all, ":hover")}{color:${wf} !important;filter:none !important;transform:none !important}`;
  if (hv === "arrow") out += `${pre(all, "::after")}{content:"\\2192";display:inline-block;width:0;overflow:hidden;opacity:0;transition:width .3s,margin .3s,opacity .3s;white-space:nowrap}${pre(all, ":hover::after")}{width:18px;margin-left:10px;opacity:1}`;
  return out;
}

export default function CtaLab() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(true);
  const [s, setS] = useState({ h: 0, c: 0, hv: "off" });
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("cta");
      if (q === "1") sessionStorage.setItem("ctalab", "1");
      if (q === "0") { sessionStorage.removeItem("ctalab"); sessionStorage.removeItem("ctalab-s"); }
      if (sessionStorage.getItem("ctalab") === "1") { setOn(true); const v = sessionStorage.getItem("ctalab-s"); if (v) setS(JSON.parse(v)); }
    } catch { /* private mode: no lab */ }
  }, []);
  useEffect(() => {
    if (!on) return;
    let el = document.getElementById("ctalab-css") as HTMLStyleElement | null;
    if (!el) { el = document.createElement("style"); el.id = "ctalab-css"; document.head.appendChild(el); }
    el.textContent = build(s.h, s.c, s.hv);
    try { sessionStorage.setItem("ctalab-s", JSON.stringify(s)); } catch { /* ignore */ }
  }, [on, s]);
  if (!on) return null;
  const Dot = ({ o }: { o: Opt }) => <i className="cl-dot" style={{ background: o.bg, borderColor: o.bd || "rgba(0,0,0,.25)" }} />;
  return (
    <div className="cl">
      <style>{`.cl{position:fixed;left:12px;bottom:12px;z-index:99999;font:600 12px Archivo,system-ui,sans-serif;color:#fff}.cl *{box-sizing:border-box}
.cl-t{background:#1d1d20;color:#fff;border:1px solid #444;border-radius:999px;padding:10px 16px;font:700 11px Archivo,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.cl-p{margin-bottom:8px;background:rgba(29,29,32,.96);border:1px solid #444;border-radius:18px;padding:14px;width:min(420px,calc(100vw - 24px));max-height:62vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.cl-p h5{margin:10px 0 6px;font:700 10px Archivo,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#aaa}.cl-p h5:first-child{margin-top:0}
.cl-g{display:flex;flex-wrap:wrap;gap:6px}.cl-b{display:inline-flex;align-items:center;gap:7px;background:#2b2b30;color:#fff;border:1px solid #444;border-radius:999px;padding:7px 11px;font:600 11px Archivo,sans-serif;cursor:pointer}.cl-b.on{background:#7E0508;border-color:#7E0508}
.cl-dot{width:12px;height:12px;border-radius:50%;border:1px solid;display:inline-block;flex:none}.cl-s{margin-top:12px;padding-top:10px;border-top:1px solid #333;font:500 11px/1.5 Archivo,sans-serif;color:#ccc}.cl-x{color:#aaa;background:none;border:0;text-decoration:underline;cursor:pointer;font:600 11px Archivo,sans-serif;padding:0}`}</style>
      {open && (
        <div className="cl-p">
          <h5>Hero button (home, desktop)</h5>
          <div className="cl-g">{HERO.map((o, i) => <button key={o.n} type="button" className={`cl-b${s.h === i ? " on" : ""}`} onClick={() => setS(p => ({ ...p, h: i }))}><Dot o={o} />{o.n}</button>)}</div>
          <h5>All the other red buttons</h5>
          <div className="cl-g">{CTA.map((o, i) => <button key={o.n} type="button" className={`cl-b${s.c === i ? " on" : ""}`} onClick={() => setS(p => ({ ...p, c: i }))}><Dot o={o} />{o.n}</button>)}</div>
          <h5>Hover effect</h5>
          <div className="cl-g">{HOVER.map(([k, n]) => <button key={k} type="button" className={`cl-b${s.hv === k ? " on" : ""}`} onClick={() => setS(p => ({ ...p, hv: k }))}>{n}</button>)}</div>
          <div className="cl-s">Hero: <b>{HERO[s.h].n}</b> &middot; Buttons: <b>{CTA[s.c].n}</b> &middot; Hover: <b>{HOVER.find(x => x[0] === s.hv)![1]}</b><br />Browse any page, open the bag, add to bag. <button type="button" className="cl-x" onClick={() => setS({ h: 0, c: 0, hv: "off" })}>Reset</button> &middot; <button type="button" className="cl-x" onClick={() => { try { sessionStorage.removeItem("ctalab"); sessionStorage.removeItem("ctalab-s"); } catch { /* ignore */ } document.getElementById("ctalab-css")?.remove(); setOn(false); }}>Close the lab</button></div>
        </div>
      )}
      <button type="button" className="cl-t" onClick={() => setOpen(!open)}>{open ? "Hide" : "Button lab"}</button>
    </div>
  );
}
