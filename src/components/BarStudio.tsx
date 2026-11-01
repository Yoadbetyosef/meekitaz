"use client";
import { useEffect, useMemo, useState } from "react";

/* Bar studio — for Yoad only: meekitaz.com/?palette=bar opens a panel to play with the menu pill and the bag circle:
   size, place, corners, colours, glass, blur and brightness. Phones and computers are tuned separately (each keeps its own values).
   Everything stays in this browser (localStorage); visitors see the site's own bar until the values are copied into the code. */
type V = Record<string, number | string | boolean>;
const ON = "mk-barstudio";
const DEF_D: V = { pw: 680, ph: 28, top: 30, x: 0, rad: 999, logo: 34, cs: 74, ctop: 30, cx: 0, color: "#F42A3B", alpha: 42, blur: 16, light: 0, fg: "#FFFFFF", split: false, ccolor: "#F42A3B", calpha: 42 };
const DEF_M: V = { pl: 14, pr: 86, ph: 18, top: 18, rad: 999, logo: 28, cs: 58, ctop: 18, cright: 14, color: "#F42A3B", alpha: 42, blur: 16, light: 0, fg: "#FFFFFF", split: false, ccolor: "#F42A3B", calpha: 42 };

const shade = (hex: string, amt: number) => { // amt −50…50: darker … lighter
  const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt) / 100;
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
};

export default function BarStudio() {
  const [open, setOpen] = useState(false), [mini, setMini] = useState(false);
  const [mob, setMob] = useState(false);
  const [v, setV] = useState<V>(DEF_D);
  const key = mob ? "mk-bs-m" : "mk-bs-d", DEF = mob ? DEF_M : DEF_D;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    let on = false; try { on = localStorage.getItem(ON) === "1"; } catch {}
    if (q.get("palette") === "bar") { on = true; try { localStorage.setItem(ON, "1"); } catch {} }
    const m = window.matchMedia("(max-width:767px)"); const set = () => setMob(m.matches); set(); m.addEventListener("change", set);
    setOpen(on); return () => m.removeEventListener("change", set);
  }, []);
  useEffect(() => { let s: V | null = null; try { s = JSON.parse(localStorage.getItem(key) || "null"); } catch {} setV({ ...DEF, ...(s || {}) }); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // write the values onto <body> as CSS variables (only while the studio is on)
  useEffect(() => {
    const b = document.body; if (!open) { b.classList.remove("bs-on", "bs-split"); return; }
    const st = b.style, px = (n: unknown) => `${n}px`;
    b.classList.add("bs-on"); b.classList.toggle("bs-split", !!v.split);
    st.setProperty("--bs-top", px(v.top)); st.setProperty("--bs-ph", px(v.ph)); st.setProperty("--bs-rad", px(v.rad)); st.setProperty("--bs-logo", px(v.logo));
    st.setProperty("--bs-cs", px(v.cs)); st.setProperty("--bs-ctop", px(v.ctop));
    if (mob) { st.setProperty("--bs-pl", px(v.pl)); st.setProperty("--bs-pr", px(v.pr)); st.setProperty("--bs-cright", px(v.cright)); }
    else { st.setProperty("--bs-pw", px(v.pw)); st.setProperty("--bs-x", px(v.x)); st.setProperty("--bs-cx", px(v.cx)); }
    st.setProperty("--nav-bg", shade(String(v.color), Number(v.light))); st.setProperty("--nav-a", `${v.alpha}%`);
    st.setProperty("--cart-bg", shade(String(v.ccolor), Number(v.light))); st.setProperty("--cart-a", `${v.calpha}%`);
    st.setProperty("--bs-blur", px(v.blur)); st.setProperty("--bs-fg", String(v.fg));
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [v, open, mob, key]);

  const put = (k: string, x: number | string | boolean) => setV(s => ({ ...s, [k]: x }));
  const reset = () => { try { localStorage.removeItem(key); } catch {} setV({ ...DEF }); };
  const hide = () => { setOpen(false); try { localStorage.removeItem(ON); } catch {} ["--bs-top","--bs-ph","--bs-rad","--bs-logo","--bs-cs","--bs-ctop","--bs-pl","--bs-pr","--bs-cright","--bs-pw","--bs-x","--bs-cx","--nav-bg","--nav-a","--cart-bg","--cart-a","--bs-blur","--bs-fg"].forEach(p => document.body.style.removeProperty(p)); };
  const json = useMemo(() => JSON.stringify({ screen: mob ? "phone" : "computer", ...v }), [v, mob]);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };

  if (!open) return null;
  const S = ({ k, label, min, max, step = 1, unit = "px" }: { k: string; label: string; min: number; max: number; step?: number; unit?: string }) => (
    <label className="bs-r"><span>{label}</span><input type="range" min={min} max={max} step={step} value={Number(v[k])} onChange={e => put(k, +e.target.value)} /><b>{String(v[k])}{unit}</b></label>
  );
  const C = ({ k, label }: { k: string; label: string }) => (
    <label key={k} className="bs-r bs-c"><span>{label}</span><input type="color" value={String(v[k])} onChange={e => put(k, e.target.value.toUpperCase())} /><b>{String(v[k])}</b></label>
  );
  return (
    <div className={`bs${mini ? " mini" : ""}`} role="dialog" aria-label="Bar studio">
      <div className="bs-top"><b>Bar studio · {mob ? "phone" : "computer"}</b><span><button onClick={() => setMini(m => !m)}>{mini ? "▴" : "▾"}</button><button onClick={hide} aria-label="Close">×</button></span></div>
      {!mini && <div className="bs-body">
        <p className="bs-h">Menu pill</p>
        {mob ? <>{S({ k: "pl", label: "Left edge", min: 0, max: 60 })}{S({ k: "pr", label: "Right edge", min: 60, max: 160 })}</> : <>{S({ k: "pw", label: "Width", min: 420, max: 1100 })}{S({ k: "x", label: "Move sideways", min: -300, max: 300 })}</>}
        {S({ k: "ph", label: "Height", min: 6, max: 40 })}{S({ k: "top", label: "From top", min: 0, max: 90 })}{S({ k: "rad", label: "Corners", min: 0, max: 60 })}{S({ k: "logo", label: "Logo size", min: 18, max: 48 })}
        <p className="bs-h">Bag circle</p>
        {S({ k: "cs", label: "Size", min: 40, max: 110 })}{S({ k: "ctop", label: "From top", min: 0, max: 90 })}
        {mob ? S({ k: "cright", label: "From right", min: 0, max: 60 }) : S({ k: "cx", label: "Move sideways", min: -200, max: 300 })}
        <p className="bs-h">Colour</p>
        {C({ k: "color", label: "Colour" })}{S({ k: "alpha", label: "Glass (solid →)", min: 5, max: 100, unit: "%" })}{S({ k: "light", label: "Brightness", min: -50, max: 50, unit: "" })}{S({ k: "blur", label: "Blur behind", min: 0, max: 40 })}{C({ k: "fg", label: "Logo & icons" })}
        <label className="bs-r bs-k"><input type="checkbox" checked={!!v.split} onChange={e => put("split", e.target.checked)} /><span>Bag in its own colour</span></label>
        {v.split && <>{C({ k: "ccolor", label: "Bag colour" })}{S({ k: "calpha", label: "Bag glass", min: 5, max: 100, unit: "%" })}</>}
        <div className="bs-act"><button onClick={copy}>{copied ? "Copied ✓" : "Copy settings"}</button><button onClick={reset}>Reset</button></div>
        <p className="bs-note">Only you see this. When you like it, press “Copy settings” and paste it to me.</p>
      </div>}
    </div>
  );
}
