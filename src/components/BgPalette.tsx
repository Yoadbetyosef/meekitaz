"use client";
import { useEffect, useState } from "react";

/* Home background tester — for Yoad only. Open meekitaz.com/?palette to show the panel; it stays on in that browser
   until "Hide". The colour you pick applies only in your own browser (localStorage); visitors keep the site's default
   until the default in globals.css (--home-bg) is changed. */
const SWATCHES: { name: string; hex: string }[] = [
  { name: "Mist (original)", hex: "#E4E8EC" },
  { name: "Plum (trial)", hex: "#4B1425" },
  { name: "Burgundy", hex: "#6B1E2E" },
  { name: "Ink", hex: "#1C1A1B" },
  { name: "Midnight", hex: "#1F2A44" },
  { name: "Forest", hex: "#1E3A2F" },
  { name: "Mocha", hex: "#4A3B33" },
  { name: "Cream", hex: "#FBF8F3" },
  { name: "Champagne", hex: "#EFE6D8" },
  { name: "Sky", hex: "#DCEBF4" },
  { name: "Baby pink", hex: "#F7D3DA" },
  { name: "Blush", hex: "#EFC5CA" },
  { name: "Butter", hex: "#F7E9A8" },
  { name: "Sage", hex: "#D6E4C8" },
];
const KEY = "mk-home-bg", ON = "mk-palette";
const isLight = (hex: string) => {
  const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b > .35;
};
function apply(hex: string | null) {
  const b = document.body;
  if (!hex) { b.style.removeProperty("--home-bg"); b.classList.remove("home-light"); return; }
  b.style.setProperty("--home-bg", hex); b.classList.toggle("home-light", isLight(hex));
}

export default function BgPalette() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<string | null>(null);
  const [hexIn, setHexIn] = useState("");

  useEffect(() => {
    let saved: string | null = null, on = false;
    try { saved = localStorage.getItem(KEY); on = localStorage.getItem(ON) === "1"; } catch {}
    if (new URLSearchParams(location.search).has("palette")) { on = true; try { localStorage.setItem(ON, "1"); } catch {} }
    if (saved) { apply(saved); setCur(saved); setHexIn(saved); }
    setOpen(on);
  }, []);

  const pick = (hex: string) => {
    const h = hex.startsWith("#") ? hex.toUpperCase() : ("#" + hex).toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(h)) return;
    apply(h); setCur(h); setHexIn(h); try { localStorage.setItem(KEY, h); } catch {}
  };
  const reset = () => { apply(null); setCur(null); setHexIn(""); try { localStorage.removeItem(KEY); } catch {} };
  const hide = () => { setOpen(false); try { localStorage.removeItem(ON); } catch {} };

  if (!open) return null;
  return (
    <div className="bgp" role="dialog" aria-label="Home background">
      <div className="bgp-top"><b>Home background</b><button onClick={hide} aria-label="Hide">×</button></div>
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
      <div className="bgp-now">{cur ? <>{SWATCHES.find(s => s.hex === cur)?.name || "Custom"} · <code>{cur}</code></> : "Site default"}</div>
      <button className="bgp-reset" onClick={reset}>Back to site default</button>
    </div>
  );
}
