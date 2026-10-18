"use client";

export type DFilters = { carat: [number, number]; price: [number, number]; color: [number, number]; clarity: [number, number] };
export const COLORS = ["D", "E", "F", "G", "H", "I"];
export const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2"];
export const DEFAULT_FILTERS: DFilters = { carat: [1, 3], price: [100, 50000], color: [0, 5], clarity: [0, 5] };

export function Dual({ label, min, max, step, lo, hi, fmt, onChange }: { label: string; min: number; max: number; step: number; lo: number; hi: number; fmt: (v: number) => string; onChange: (lo: number, hi: number) => void }) {
  const a = Math.min(lo, hi), b = Math.max(lo, hi);
  const L = ((a - min) / (max - min)) * 100, R = 100 - ((b - min) / (max - min)) * 100;
  return (
    <div className="dfp-blk"><span className="dfp-lbl">{label}</span>
      <div className="rng">
        <input type="range" min={min} max={max} step={step} value={lo} onChange={e => onChange(+e.target.value, hi)} aria-label={`${label} minimum`} />
        <input type="range" min={min} max={max} step={step} value={hi} onChange={e => onChange(lo, +e.target.value)} aria-label={`${label} maximum`} />
        <div className="rng-track"><div className="rng-fill" style={{ left: `${L}%`, right: `${R}%` }} /></div>
      </div>
      <div className="rng-val"><span>{fmt(a)}</span><span>{fmt(b)}{b >= max ? "+" : ""}</span></div>
    </div>
  );
}

export function Scale({ label, kind, items, notes, hint, value, onChange }: { label: string; kind: string; items: string[]; notes: string[]; hint: string; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const last = items.length - 1, [a, b] = value, any = a === 0 && b === last;
  // first tap sets one grade, a second tap on another grade makes a range, tapping the only selected grade clears it
  const pick = (i: number) => onChange(any ? [i, i] : a === b ? (i === a ? [0, last] : [Math.min(a, i), Math.max(a, i)]) : [i, i]);
  return (
    <div className="dfp-blk"><span className="dfp-lbl">{label}</span>
      <div className={`dfp-bar ${kind}${any ? " any" : ""}`}>
        {items.map((x, i) => <button key={x} type="button" style={{ "--i": i } as React.CSSProperties} className={!any && (i === a || i === b) ? "on" : !any && i > a && i < b ? "in" : ""} onClick={() => pick(i)}>{x}<small>{notes[i] || "\u00a0"}</small></button>)}
      </div>
      <div className="dfp-hint">{hint}</div>
    </div>
  );
}

export default function DiamondFilters({ f, setF }: { f: DFilters; setF: (f: DFilters) => void }) {
  return (
    <section className="filters" aria-label="Filter diamonds">
      <div className="wrap">
        <div className="dfp">
          <div className="dfp-head"><div><small className="eyebrow">Refine</small><h2>Carat, price, color, clarity</h2></div><button className="flt-reset" type="button" onClick={() => setF(DEFAULT_FILTERS)}>Reset</button></div>
          <Dual label="Carat" min={0.5} max={20} step={0.1} lo={f.carat[0]} hi={f.carat[1]} fmt={v => v.toFixed(1) + " ct"} onChange={(a, b) => setF({ ...f, carat: [a, b] })} />
          <Dual label="Price" min={100} max={50000} step={100} lo={f.price[0]} hi={f.price[1]} fmt={v => "$" + Math.round(v).toLocaleString("en-US")} onChange={(a, b) => setF({ ...f, price: [a, b] })} />
          <Scale label="Color" kind="col" items={COLORS} notes={["Colorless", "", "", "Near colorless", "", ""]} hint="D is colorless. We stop at I. Tap one grade, then another, for a range." value={f.color} onChange={v => setF({ ...f, color: v })} />
          <Scale label="Clarity" kind="cla" items={CLARITIES} notes={["Flawless", "Internal", "Very, very slight", "Very, very slight", "Very slight", "Very slight"]} hint="Eye-clean from VS2 up. Nothing below." value={f.clarity} onChange={v => setF({ ...f, clarity: v })} />
        </div>
      </div>
    </section>
  );
}
