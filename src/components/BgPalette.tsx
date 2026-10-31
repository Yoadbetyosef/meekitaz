"use client";
import { useEffect, useState } from "react";

/* Site colour tester (home colours + the top bar) — for Yoad only. Open meekitaz.com/?palette to show the panel; it stays on in that browser until ×.
   Four targets: background, headings, text, accent (the small red/pink labels). Choices apply only in your own browser
   (localStorage); visitors keep the defaults in globals.css until they are changed there. */
const SWATCHES: { name: string; hex: string }[] = [
  { name: "Mist (original bg)", hex: "#E4E8EC" }, { name: "Plum", hex: "#4B1425" }, { name: "Burgundy", hex: "#6B1E2E" },
  { name: "Red (original accent)", hex: "#7E0508" }, { name: "Ink (original text)", hex: "#1C1A1B" }, { name: "Midnight", hex: "#1F2A44" },
  { name: "Forest", hex: "#1E3A2F" }, { name: "Mocha", hex: "#4A3B33" }, { name: "White", hex: "#FFFFFF" },
  { name: "Cream", hex: "#FBF8F3" }, { name: "Champagne", hex: "#EFE6D8" }, { name: "Gold", hex: "#C29A55" },
  { name: "Sky", hex: "#DCEBF4" }, { name: "Baby pink", hex: "#F7D3DA" }, { name: "Blush", hex: "#EFC5CA" },
  { name: "Butter", hex: "#F7E9A8" }, { name: "Sage", hex: "#D6E4C8" }, { name: "Rose", hex: "#E8B4B8" },
];
type T = "bg" | "head" | "fg" | "accent" | "nav" | "navfg" | "badge" | "badgefg";
const TARGETS: { k: T; label: string; v: string }[] = [
  { k: "bg", label: "Background", v: "--home-bg" }, { k: "head", label: "Headings", v: "--home-head" },
  { k: "fg", label: "Text", v: "--home-fg" }, { k: "accent", label: "Accent", v: "--home-accent" },
  { k: "nav", label: "Bar", v: "--nav-bg" }, { k: "navfg", label: "Bar icons", v: "--nav-fg" },
  { k: "badge", label: "Bag count", v: "--badge-bg" }, { k: "badgefg", label: "Count number", v: "--badge-fg" },
];
const EMPTY: Record<T, string | null> = { bg: null, head: null, fg: null, accent: null, nav: null, navfg: null, badge: null, badgefg: null };
const GLASS = "mk-nav-glass";
const ON = "mk-palette", key = (t: T) => "mk-home-" + t;
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b > .35;
};
function apply(t: T, hex: string | null) {
  const b = document.body, v = TARGETS.find(x => x.k === t)!.v;
  if (hex) b.style.setProperty(v, hex); else b.style.removeProperty(v);
  if (t === "bg") b.classList.toggle("home-light", !!hex && isLight(hex));
  if (t === "nav") b.classList.toggle("nav-custom", !!hex);
  if (t === "navfg") b.classList.toggle("navfg-custom", !!hex);
}
const setGlass = (g: number) => document.body.style.setProperty("--nav-a", g + "%");
const LOCKED = new Set<T>(["nav", "navfg"]); // the bar was locked as the site default on 2026-10-30

export default function BgPalette() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<T>("bg");
  const [vals, setVals] = useState<Record<T, string | null>>(EMPTY);
  const [glass, setG] = useState(42);
  const [hexIn, setHexIn] = useState("");

  useEffect(() => {
    const v: Record<T, string | null> = { ...EMPTY }; let on = false;
    try {
      TARGETS.forEach(({ k }) => { if (LOCKED.has(k)) { localStorage.removeItem(key(k)); return; } v[k] = localStorage.getItem(key(k)); if (v[k]) apply(k, v[k]); }); on = localStorage.getItem(ON) === "1";
      localStorage.removeItem(GLASS);
    } catch {}
    if (new URLSearchParams(location.search).has("palette")) { on = true; try { localStorage.setItem(ON, "1"); } catch {} }
    setVals(v); setHexIn(v.bg || ""); setOpen(on);
  }, []);

  const pick = (hex: string) => {
    const h = (hex.startsWith("#") ? hex : "#" + hex).toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(h)) return;
    apply(tab, h); setVals(s => ({ ...s, [tab]: h })); setHexIn(h); try { localStorage.setItem(key(tab), h); } catch {}
  };
  const clear = (t: T) => { apply(t, null); setVals(s => ({ ...s, [t]: null })); if (t === tab) setHexIn(""); try { localStorage.removeItem(key(t)); } catch {} };
  const resetAll = () => { TARGETS.forEach(({ k }) => clear(k)); document.body.style.removeProperty("--nav-a"); setG(42); try { localStorage.removeItem(GLASS); } catch {} };
  const glassTo = (g: number) => { setGlass(g); setG(g); try { localStorage.setItem(GLASS, String(g)); } catch {} };
  const hide = () => { setOpen(false); try { localStorage.removeItem(ON); } catch {} };
  const cur = vals[tab];

  if (!open) return null;
  return (
    <div className="bgp" role="dialog" aria-label="Site colours">
      <div className="bgp-top"><b>Site colours</b><button onClick={hide} aria-label="Hide">×</button></div>
      <div className="bgp-tabs">
        {TARGETS.filter(t => !LOCKED.has(t.k)).map(t => (
          <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => { setTab(t.k); setHexIn(vals[t.k] || ""); }}>
            <i style={{ background: vals[t.k] || "transparent" }} />{t.label}
          </button>
        ))}
      </div>
      <div className="bgp-sw">
        {SWATCHES.map(s => (
          <button key={s.hex} title={`${s.name} ${s.hex}`} aria-label={s.name} onClick={() => pick(s.hex)}
            className={cur === s.hex ? "on" : ""} style={{ background: s.hex }} />
        ))}
      </div>
      <div className="bgp-row">
        <input type="color" value={cur || "#4B1425"} onChange={e => pick(e.target.value)} aria-label="Any colour" />
        <input type="text" value={hexIn} placeholder="#4B1425" onChange={e => setHexIn(e.target.value)} onKeyDown={e => e.key === "Enter" && pick(hexIn)} aria-label="Hex" />
        <button onClick={() => pick(hexIn)}>Set</button>
      </div>
      <div className="bgp-now">
        {TARGETS.find(t => t.k === tab)!.label}: {cur ? <><code>{cur}</code> · <button className="bgp-x" onClick={() => clear(tab)}>default</button></> : tab === "accent" || tab === "head" || tab === "fg" ? "automatic (matches background)" : "site default" }
      </div>
      <button className="bgp-reset" onClick={resetAll}>Reset everything</button>
    </div>
  );
}
