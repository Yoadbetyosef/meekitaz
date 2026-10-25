"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* Ring size picker for the bag: US 3–13 in quarter sizes, opens centred on the chosen size (or 6). */
const SIZES = Array.from({ length: 41 }, (_, i) => 3 + i * 0.25);
export const fmtSize = (v: string | number) => { const s = Number(v); if (!isFinite(s) || !v) return ""; const w = Math.floor(s), f = Math.round((s - w) * 100); return `${w}${f === 25 ? "¼" : f === 50 ? "½" : f === 75 ? "¾" : ""}`; };

export default function SizePicker({ id, value, disabled, onPick }: { id: string; value: string; disabled?: boolean; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", out); document.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc, true); };
  }, [open]);
  useLayoutEffect(() => {
    if (!open || !list.current) return;
    const t = list.current.querySelector<HTMLElement>(`[data-s="${Number(value) || 6}"]`);
    if (t) list.current.scrollTop = t.offsetTop - list.current.clientHeight / 2 + t.clientHeight / 2;
  }, [open, value]);
  return (
    <div className={`cd-size${value ? "" : " need"}`} ref={box}>
      <label htmlFor={`sz-${id}`}>Ring size (US)</label>
      <button id={`sz-${id}`} type="button" className={`sp-btn${open ? " open" : ""}`} disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{value ? fmtSize(value) : "Select size"}</span><i />
      </button>
      {open && (
        <div className="sp-pop">
          <div className="sp-hd"><span>US size</span><span>¼ · ½ · ¾</span></div>
          <div className="sp-list" role="listbox" ref={list} aria-label="Ring size">
            {SIZES.map(s => (
              <button key={s} type="button" role="option" aria-selected={Number(value) === s} data-s={s}
                className={`${Number.isInteger(s) ? "whole" : ""}${Number(value) === s ? " on" : ""}`}
                onClick={() => { onPick(String(s)); setOpen(false); }}>{fmtSize(s)}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
