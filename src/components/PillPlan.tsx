"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlanRoom } from "./PlanKit";
import { savePlan, saveFit, planTotal, usdR } from "@/lib/plan";

/* The smart pill (approved 2026-11-11, "S2 + S3"): once a plan is started, the menu pill carries it. A white chip that talks about the
   page you're on — "14 fit your plan ✓" in a category, "This one $13 a day ✓" on a piece, "$19 a day left" when the bag has things in it —
   and a tap opens the pill itself downward into a card: the amount a day, the months, what the bag takes and what's left, "Show what
   fits first". The heart and the search move into the card while a plan is on, so the pill stays clean. Pages tell it what to say with
   the "mk-plan-ctx" event. */
type Ctx = { kind: "cat"; fit: number } | { kind: "prod"; perDay: number; fits: boolean } | null;

export default function PillPlan({ onWish, onSearch }: { onWish: () => void; onSearch: () => void }) {
  const r = usePlanRoom(); const path = usePathname();
  const [open, setOpen] = useState(false), [ctx, setCtx] = useState<Ctx>(null);
  useEffect(() => { setCtx(null); setOpen(false); }, [path]);
  useEffect(() => { const f = (e: Event) => setCtx((e as CustomEvent<Ctx>).detail); window.addEventListener("mk-plan-ctx", f); return () => window.removeEventListener("mk-plan-ctx", f); }, []);
  useEffect(() => { document.body.classList.toggle("pp-has", !!r); document.body.classList.toggle("pp-open", !!r && open); }, [r, open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);
  if (!r) return null;
  const { p, bag, left, leftDay, fit } = r, total = planTotal(p), used = Math.min(100, total ? bag / total * 100 : 0);
  const say = ctx?.kind === "cat" ? <><b>{ctx.fit}</b><small>fit your plan</small>{ctx.fit > 0 && <i className="ok">✓</i>}</>
    : ctx?.kind === "prod" ? <><small>This one</small><b>{usdR(ctx.perDay)}</b><small>a day</small>{ctx.fits ? <i className="ok">✓</i> : <i className="up">+{usdR(ctx.perDay - Math.max(0, leftDay))}</i>}</>
    : bag > 0 ? <><b>{usdR(Math.max(0, leftDay))}</b><small>{leftDay >= 0 ? "a day left" : "a day over"}</small></>
    : <><b>{usdR(p.day)}</b><small>a day</small></>;
  return (
    <>
      <button type="button" className="pp-chip" aria-expanded={open} aria-controls="pp-sheet" onClick={() => setOpen(o => !o)}>{say}<span className="pp-dot" aria-hidden="true">{open ? "▴" : "▾"}</span></button>
      <div id="pp-sheet" className={`pp-sheet${open ? " on" : ""}`} role="dialog" aria-label="Your Meekitaz Daily plan" aria-hidden={!open}>
        <div className="pp-row"><span>Your plan · a day</span><b>{usdR(p.day)}</b></div>
        <input type="range" min={1} max={50} value={p.day} onChange={e => savePlan({ ...p, day: +e.target.value })} aria-label="Dollars a day" />
        <div className="pp-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === p.months ? "on" : ""} onClick={() => savePlan({ ...p, months: m })}>{m} mo</button>)}</div>
        <div className="pp-meter" aria-hidden="true"><i className="u" style={{ width: used + "%" }} /><i className="l" style={{ width: (100 - used) + "%" }} /></div>
        <div className="pp-leg"><span>{bag > 0 ? `In your bag: ${usdR(bag)}` : `Yours, up to ${usdR(total)}`}</span><span>{bag > 0 ? (left >= 0 ? `${usdR(Math.max(0, leftDay))} a day left` : `${usdR(-leftDay)} a day over`) : `${p.months} months`}</span></div>
        <label className="pp-sw"><span>Show what fits first</span><input type="checkbox" checked={fit} onChange={() => saveFit(!fit)} /><i aria-hidden="true" /></label>
        <div className="pp-also"><button type="button" onClick={() => { setOpen(false); onWish(); }}>♡ Saved</button><button type="button" onClick={() => { setOpen(false); onSearch(); }}>⌕ Search</button></div>
      </div>
    </>
  );
}
