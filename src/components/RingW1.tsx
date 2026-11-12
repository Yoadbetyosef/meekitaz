"use client";
import Image from "next/image";
import { useState } from "react";
import { saveSetting, settingFrom, baseShape, type Setting } from "@/lib/setting";
import { karatsFor, karatStep, isGoldMetal, GOLD_COLORS } from "@/lib/karat";
import { stonePicture } from "@/lib/stonePicture";
import { usdR } from "@/lib/plan";

/* Build your ring — "W1" (approved 2026-11-12): the ring as it will be, big; under it three tiles you tap — the diamond, the setting,
   the gold. The gold opens right there (karat + colour) and the price a day below changes at once; the diamond and the setting open
   their swap drawers. Nothing makes the customer go round again. */
const SW: Record<string, string> = { "White gold": "linear-gradient(135deg,#F4F5F7,#BFC4CC)", "Yellow gold": "linear-gradient(135deg,#F3D27A,#C9982E)", "Rose gold": "linear-gradient(135deg,#F2C6B4,#C98C74)", Platinum: "linear-gradient(135deg,#F4F5F7,#AEB4BD)", Silver: "linear-gradient(135deg,#F4F5F7,#C9CDD3)" };

export default function RingW1({ shown, shapeName, stoneTitle, stoneSub, stonePrice, stoneImg, onSwap, extra }: {
  shown: Setting; shapeName: string; stoneTitle: string; stoneSub: string; stonePrice: number; stoneImg?: string; onSwap: (m: "stone" | "setting") => void; extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const months = 4, day = (n: number) => Math.ceil(n / (30 * months));
  const karats = isGoldMetal(shown.metal) ? karatsFor(shown.ns) : [];
  const k = shown.karat || (karats.length ? "10K" : "");
  const base = shown.price - (k ? karatStep(shown.ns, k) : 0);
  const say = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(""), 1800); };
  const pickKarat = (nk: string) => { const price = base + karatStep(shown.ns, nk); saveSetting({ ...shown, karat: nk, price }); say(`Updated · ${nk} ${shown.metal.toLowerCase()} · ${usdR(day(price + stonePrice))} a day`); };
  const pickColour = async (metal: string) => {
    if (metal === shown.metal || busy) return; setBusy(true);
    try {
      const j = await (await fetch(`/api/setting?${new URLSearchParams({ ns: shown.ns, shape: baseShape(shapeName), metal, color: shown.color || "" })}`)).json();
      if (j.item) { const ns = settingFrom({ ...shown, karat: k || undefined }, j.item); saveSetting(ns); say(`Updated · ${[k, metal.toLowerCase()].filter(Boolean).join(" ")} · ${usdR(day(ns.price + stonePrice))} a day`); }
      else say(`Not made in ${metal.toLowerCase()}`);
    } catch { say("Try again in a moment"); }
    setBusy(false);
  };
  const metalWord = [k, shown.metal.replace(" gold", "")].filter(Boolean).join(" ");
  const stoneDay = day(stonePrice), setDay = day(shown.price);
  return (
    <div className="w1">
      <div className="w1-hero">
        <span className="w1-tag">Your ring · as it will be</span>
        {shown.image && <Image src={shown.image} alt={shown.title} fill sizes="(max-width:767px) 92vw, 46vw" quality={80} className="w1-im" />}
        <div className="w1-tt"><small>{shown.title.replace(/^(Yellow|White|Rose) gold |^Platinum |^Silver /i, "")}</small><b>{stoneTitle} · {metalWord}</b></div>
      </div>
      <div className="w1-parts">
        <button type="button" className="w1-p" onClick={() => onSwap("stone")}>
          <span className="w1-ed">Change</span>
          <span className="w1-th">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={stoneImg || stonePicture(shapeName)} alt="" /></span>
          <span className="w1-k">Diamond</span><span className="w1-t">{stoneTitle}</span><span className="w1-d">{usdR(stoneDay)} a day</span>
        </button>
        <button type="button" className="w1-p" onClick={() => onSwap("setting")}>
          <span className="w1-ed">Change</span>
          <span className="w1-th">{shown.image && <Image src={shown.image} alt="" fill sizes="30vw" quality={70} />}</span>
          <span className="w1-k">Setting</span><span className="w1-t">{shown.title.replace(/^(Yellow|White|Rose) gold |^Platinum |^Silver /i, "").replace(new RegExp(`^${shapeName} Diamond `, "i"), "").split(" ").slice(0, 3).join(" ")}</span><span className="w1-d">{usdR(setDay)} a day</span>
        </button>
        <button type="button" className={`w1-p${open ? " on" : ""}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span className="w1-ed">Change</span>
          <span className="w1-th w1-sw"><i style={{ background: SW[shown.metal] || SW["Yellow gold"] }} /></span>
          <span className="w1-k">Gold</span><span className="w1-t">{metalWord}</span><span className="w1-d">{k ? (k === "10K" ? "the base" : `+${usdR(day(karatStep(shown.ns, k)))} a day`) : "included"}</span>
        </button>
      </div>
      <div className={`w1-dr${open ? " on" : ""}`}>
        <div className="w1-drin">
          <div className="w1-h"><span>The gold</span><button type="button" onClick={() => setOpen(false)}>Done</button></div>
          {karats.length > 0 && <div className="w1-seg" role="group" aria-label="Karat">{karats.map(x => {
            const dd = day(karatStep(shown.ns, x)) - day(karatStep(shown.ns, k));
            return <button key={x} type="button" className={x === k ? "on" : ""} aria-pressed={x === k} onClick={() => pickKarat(x)}>{x}<small>{x === k ? "now" : `${dd >= 0 ? "+" : "−"}${usdR(Math.abs(dd))}/day`}</small></button>;
          })}</div>}
          {isGoldMetal(shown.metal) && <div className="w1-cols">{GOLD_COLORS.map(c => <button key={c} type="button" aria-label={c} aria-pressed={c === shown.metal} className={c === shown.metal ? "on" : ""} style={{ background: SW[c] }} onClick={() => pickColour(c)} />)}<span>{shown.metal}</span></div>}
        </div>
      </div>
      {extra && <div className="w1-extra">{extra}</div>}
      <div className={`w1-toast${msg ? " on" : ""}`} role="status">{msg}</div>
    </div>
  );
}
