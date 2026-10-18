"use client";
import { useState } from "react";

function Dual({ label, min, max, step, lo, hi, fmt, onChange }: { label: string; min: number; max: number; step: number; lo: number; hi: number; fmt: (v: number) => string; onChange: (lo: number, hi: number) => void }) {
  const a = Math.min(lo, hi), b = Math.max(lo, hi);
  const L = ((a - min) / (max - min)) * 100, R = 100 - ((b - min) / (max - min)) * 100;
  return (
    <div className="flt"><label>{label}</label>
      <div className="rng">
        <input type="range" min={min} max={max} step={step} value={lo} onChange={e => onChange(+e.target.value, hi)} aria-label={`${label} minimum`} />
        <input type="range" min={min} max={max} step={step} value={hi} onChange={e => onChange(lo, +e.target.value)} aria-label={`${label} maximum`} />
        <div className="rng-track"><div className="rng-fill" style={{ left: `${L}%`, right: `${R}%` }} /></div>
      </div>
      <div className="rng-val"><span>{fmt(a)}</span><span>{fmt(b)}</span></div>
    </div>
  );
}
function Seg({ label, opts, on, toggle, note }: { label: string; opts: string[]; on: string[]; toggle: (v: string) => void; note: string }) {
  return (<div className="flt"><label>{label}</label><div className="seg">{opts.map(o => <button key={o} type="button" className={on.includes(o) ? "on" : ""} onClick={() => toggle(o)}>{o}</button>)}</div><div className="flt-note">{note}</div></div>);
}

export default function DiamondFilters() {
  const init = { carat: [1, 5] as [number, number], price: [1500, 20000] as [number, number], color: ["D", "E", "F"], clarity: ["FL", "IF", "VVS1", "VVS2"] };
  const [f, setF] = useState(init);
  const tog = (k: "color" | "clarity") => (v: string) => setF(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));
  return (
    <section className="filters" aria-label="Filter diamonds">
      <div className="wrap">
        <div className="flt-head"><small className="eyebrow" style={{ width: "100%" }}>Refine</small><h2>Carat, price, color, clarity</h2><button className="flt-reset" type="button" onClick={() => setF(init)}>Reset</button></div>
        <div className="flt-grid">
          <Dual label="Carat" min={0.5} max={10} step={0.1} lo={f.carat[0]} hi={f.carat[1]} fmt={v => v.toFixed(1) + " ct"} onChange={(a, b) => setF(s => ({ ...s, carat: [a, b] }))} />
          <Dual label="Price" min={500} max={50000} step={100} lo={f.price[0]} hi={f.price[1]} fmt={v => "$" + Math.round(v).toLocaleString("en-US")} onChange={(a, b) => setF(s => ({ ...s, price: [a, b] }))} />
          <Seg label="Color" opts={["D", "E", "F", "G", "H", "I"]} on={f.color} toggle={tog("color")} note="D is colorless. We stop at I." />
          <Seg label="Clarity" opts={["FL", "IF", "VVS1", "VVS2", "VS1", "VS2"]} on={f.clarity} toggle={tog("clarity")} note="Eye-clean from VS2 up. Nothing below." />
        </div>
      </div>
    </section>
  );
}
