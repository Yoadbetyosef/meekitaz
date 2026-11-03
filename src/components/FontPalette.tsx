"use client";
import { useEffect, useState } from "react";

/* Font tester — meekitaz.com/?palette=fonts (Yoad only, this browser only). Three "White Lotus" families: classical Roman capitals for
   the headings and the small spaced labels, an old-style book serif for the regular text. "Site fonts" puts ours back. */
type Set = { id: string; name: string; note: string; href: string; display: string; body: string; title: string; sub: string; head?: string };
const SETS: Set[] = [
  { id: "cinzel", name: "Cinzel + EB Garamond", note: "the closest to the poster", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap",
    display: "'Cinzel', serif", body: "'Cinzel', serif", title: "'EB Garamond', serif", sub: "'EB Garamond', serif", head: ".04em" },
  { id: "marcellus", name: "Marcellus + Cormorant", note: "softer, more flared", href: "https://fonts.googleapis.com/css2?family=Marcellus&family=Marcellus+SC&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&display=swap",
    display: "'Marcellus', serif", body: "'Marcellus SC', serif", title: "'Cormorant Garamond', serif", sub: "'Cormorant Garamond', serif", head: ".03em" },
  { id: "cormorant", name: "Cormorant SC", note: "lightest and most elegant", href: "https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap",
    display: "'Cormorant SC', serif", body: "'Cormorant SC', serif", title: "'Cormorant Garamond', serif", sub: "'Cormorant Garamond', serif", head: ".02em" },
];
const KEY = "mk-fontset", ON = "mk-fontpal";

function apply(id: string | null) {
  const b = document.body, st = b.style, s = SETS.find(x => x.id === id);
  ["--display", "--body", "--f-title", "--sub", "--fp-head"].forEach(p => st.removeProperty(p));
  b.classList.remove("fp-on");
  if (!s) return;
  if (!document.querySelector(`link[data-fp="${s.id}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = s.href; l.dataset.fp = s.id; document.head.appendChild(l); }
  st.setProperty("--display", s.display); st.setProperty("--body", s.body); st.setProperty("--f-title", s.title); st.setProperty("--sub", s.sub); st.setProperty("--fp-head", s.head || "0");
  b.classList.add("fp-on");
}

export default function FontPalette() {
  const [open, setOpen] = useState(false), [cur, setCur] = useState<string | null>(null), [mini, setMini] = useState(false);
  useEffect(() => {
    let on = false, saved: string | null = null;
    try { on = localStorage.getItem(ON) === "1"; saved = localStorage.getItem(KEY); } catch {}
    if (new URLSearchParams(location.search).get("palette") === "fonts") { on = true; try { localStorage.setItem(ON, "1"); } catch {} }
    setOpen(on); if (saved) { setCur(saved); apply(saved); }
  }, []);
  const pick = (id: string | null) => { setCur(id); apply(id); try { id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY); } catch {} };
  const close = () => { setOpen(false); pick(null); try { localStorage.removeItem(ON); } catch {} };
  if (!open) return null;
  return (
    <div className={`fpal${mini ? " mini" : ""}`} role="dialog" aria-label="Font palette">
      <div className="fpal-top"><b>Fonts</b><span><button onClick={() => setMini(m => !m)}>{mini ? "▴" : "▾"}</button><button onClick={close} aria-label="Close">×</button></span></div>
      {!mini && <div className="fpal-list">
        {SETS.map(s => (
          <button key={s.id} className={cur === s.id ? "on" : ""} onClick={() => pick(s.id)}>
            <link rel="stylesheet" href={s.href} />
            <i style={{ fontFamily: s.display, letterSpacing: ".06em" }}>THE WHITE LOTUS</i>
            <small style={{ fontFamily: s.body, letterSpacing: ".22em" }}>SHOP THE LOOK</small>
            <em style={{ fontFamily: s.title }}>Oval Diamond Hidden Halo Ring — <span style={{ fontStyle: "italic" }}>serious diamonds, worn lightly.</span></em>
            <span className="fpal-n">{s.name} · {s.note}</span>
          </button>
        ))}
        <button className={cur === null ? "on" : ""} onClick={() => pick(null)}><span className="fpal-n">Site fonts (Prata · Archivo · Cormorant)</span></button>
        <p>Only you see this. Tell me the number you like and I&rsquo;ll set it for everyone.</p>
      </div>}
    </div>
  );
}
