"use client";
import Image from "next/image";
import { useState } from "react";
import { saveSetting, settingFrom, baseShape, type Setting } from "@/lib/setting";
import { karatsFor, karatStep, isGoldMetal, GOLD_COLORS } from "@/lib/karat";
import { usdR } from "@/lib/plan";
import type { FlowStone } from "./DiamondFlow";

/* Build your ring — "H1, clean" (approved 2026-11-12): the big square shows the DIAMOND first (its 360°), the ring waits in the corner
   ("Set in this ring ↗") and the two change places on a tap. Under it: the name and one thin line of grades + certificate, and one
   sentence that says what goes to the bag. The choices are three quiet rows with Change; the price appears once. */
const SW: Record<string, string> = { "White gold": "linear-gradient(135deg,#F4F5F7,#BFC4CC)", "Yellow gold": "linear-gradient(135deg,#F3D27A,#C9982E)", "Rose gold": "linear-gradient(135deg,#F2C6B4,#C98C74)", Platinum: "linear-gradient(135deg,#F4F5F7,#AEB4BD)", Silver: "linear-gradient(135deg,#F4F5F7,#C9CDD3)" };
const shortTitle = (t: string, shape: string) => t.replace(/^(Yellow|White|Rose) gold |^Platinum |^Silver /i, "").replace(new RegExp(`^${shape} Diamond `, "i"), "").replace(/ Engagement Ring/i, "");

export function H1Stage({ d, shown, shape, picture }: { d: FlowStone; shown: Setting; shape: string; picture: React.ReactNode }) {
  const [dia, setDia] = useState(true);
  const k = shown.karat ? `${shown.karat} ` : "";
  return (
    <div className="h1">
      <div className={`h1-sq${dia ? " is-dia" : ""}`}>
        {dia ? <div className="h1-st">{picture}</div> : <div className="h1-st h1-ring">{shown.image && <Image src={shown.image} alt={shown.title} fill sizes="(max-width:767px) 92vw, 46vw" quality={80} />}</div>}
        <button type="button" className="h1-pip" onClick={() => setDia(v => !v)} aria-label={dia ? "Show the ring" : "Show the diamond"}>
          {dia ? (shown.image && <Image src={shown.image} alt="" fill sizes="120px" quality={70} />) : /* eslint-disable-next-line @next/next/no-img-element */ <img src={d.image} alt="" referrerPolicy="no-referrer" />}
          <span>{dia ? "Set in this ring ↗" : "Your diamond ↗"}</span>
        </button>
      </div>
      {dia ? (
        <div className="h1-cap"><span className="h1-k">Your diamond</span><b>{d.carat.toFixed(2)} ct {d.shape}</b>
          <div className="h1-line">{[d.fancy || (d.color && `${d.color} color`), d.clarity, d.cut].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}<span className="ok">✓ {d.lab}</span>{d.certUrl && <a href={d.certUrl} target="_blank" rel="noopener">Certificate →</a>}</div></div>
      ) : (
        <div className="h1-cap"><span className="h1-k">Your ring</span><b>{shortTitle(shown.title, shape)} · {k}{shown.metal.replace(" gold", "")}</b>
          <div className="h1-line"><span>With your {d.carat.toFixed(2)} ct {d.shape.toLowerCase()}</span></div></div>
      )}
      <div className="h1-eq">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <i><img src={d.image} alt="" referrerPolicy="no-referrer" /></i><b>+</b><i>{shown.image && <Image src={shown.image} alt="" fill sizes="40px" quality={60} />}</i><b>=</b>
        <span>This diamond, set in the {shortTitle(shown.title, shape)} — that’s what goes to your bag.</span>
      </div>
    </div>
  );
}

export function H1Choices({ d, shown, shape, onSwap, onChange }: { d: FlowStone; shown: Setting; shape: string; onSwap: (m: "stone" | "setting") => void; onChange?: () => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const karats = isGoldMetal(shown.metal) ? karatsFor(shown.ns) : [];
  const k = shown.karat || (karats.length ? "10K" : "");
  const base = shown.price - (k ? karatStep(shown.ns, k) : 0);
  const day = (n: number) => Math.ceil(n / 120);
  const pickKarat = (nk: string) => { onChange?.(); saveSetting({ ...shown, karat: nk, price: base + karatStep(shown.ns, nk) }); };
  const pickColour = async (metal: string) => {
    if (metal === shown.metal || busy) return; onChange?.(); setBusy(true);
    try { const j = await (await fetch(`/api/setting?${new URLSearchParams({ ns: shown.ns, shape: baseShape(shape), metal, color: shown.color || "" })}`)).json(); if (j.item) saveSetting(settingFrom({ ...shown, karat: k || undefined }, j.item)); } catch { /* keep */ }
    setBusy(false);
  };
  return (
    <div className="h1-ch">
      <div className="h1-row"><span className="h1-ic">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.image} alt="" referrerPolicy="no-referrer" /></span>
        <span className="h1-tx"><small>Diamond</small><b>{d.carat.toFixed(2)} ct {d.shape}{d.color ? ` · ${d.color}` : ""}{d.clarity ? ` · ${d.clarity}` : ""}</b></span>
        <button type="button" className="h1-c" onClick={() => onSwap("stone")}>Change</button></div>
      <div className="h1-row"><span className="h1-ic">{shown.image && <Image src={shown.image} alt="" fill sizes="44px" quality={60} />}</span>
        <span className="h1-tx"><small>Setting</small><b>{shortTitle(shown.title, shape)}</b></span>
        <button type="button" className="h1-c" onClick={() => onSwap("setting")}>Change</button></div>
      <div className="h1-row"><span className="h1-ic h1-sw"><i style={{ background: SW[shown.metal] || SW["Yellow gold"] }} /></span>
        <span className="h1-tx"><small>Gold</small><b>{[k, shown.metal.replace(" gold", "")].filter(Boolean).join(" ")}</b></span>
        <button type="button" className={`h1-c${open ? " on" : ""}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? "Done" : "Change"}</button></div>
      {open && (
        <div className="h1-gold">
          {karats.length > 0 && <div className="w1-seg" role="group" aria-label="Karat">{karats.map(x => { const dd = day(karatStep(shown.ns, x)) - day(karatStep(shown.ns, k));
            return <button key={x} type="button" className={x === k ? "on" : ""} aria-pressed={x === k} onClick={() => pickKarat(x)}>{x}<small>{x === k ? "now" : `${dd >= 0 ? "+" : "−"}${usdR(Math.abs(dd))}/day`}</small></button>; })}</div>}
          {isGoldMetal(shown.metal) && <div className="w1-cols">{GOLD_COLORS.map(c => <button key={c} type="button" aria-label={c} aria-pressed={c === shown.metal} className={c === shown.metal ? "on" : ""} style={{ background: SW[c] }} onClick={() => pickColour(c)} />)}<span>{shown.metal}</span></div>}
        </div>
      )}
    </div>
  );
}
