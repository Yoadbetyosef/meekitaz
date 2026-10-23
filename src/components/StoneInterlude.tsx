"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DIAMOND } from "./StoneSwatch";

const FACT: Record<string, string> = {
  Carat: "Carat is weight, and the size you see. Two carats is about 8.2 mm across.",
  Colour: "Colour is how white it is. D to F is colourless, G to I still reads as white.",
  Clarity: "Clarity is how clean it is inside. VS and better is clean to the eye.",
  Cut: "Cut is how well it was made. It decides how it catches the light.",
};
const mm = (c: number) => +(6.5 * Math.cbrt(c)).toFixed(1);

/** The cards that sit between the rows of stones: the 4Cs you can tap, a carat ruler to scale, the appointment, the promises, the fancy colours. */
export default function StoneInterlude({ k }: { k: number }) {
  const [f, setF] = useState("Carat");
  const i = k % 5;
  if (i === 0) return (
    <div className="dm-blk a"><span className="eyebrow">The 4Cs in 30 seconds</span><h4>Carat, colour, clarity, cut.</h4><p>Tap one and we tell you what it means.</p>
      <div className="pills">{Object.keys(FACT).map(x => <button key={x} type="button" className={x === f ? "on" : ""} onClick={() => setF(x)}>{x}</button>)}</div>
      <div className="says" aria-live="polite">{FACT[f]}</div></div>
  );
  if (i === 1) return (
    <div className="dm-blk w"><span className="eyebrow">Size, in context</span><h4>What a carat looks like.</h4><p>Face-up and to scale: one carat to three.</p>
      <div className="ruler">{[1, 1.5, 2, 3].map(c => <div key={c}><i style={{ ["--mm" as string]: mm(c) } as React.CSSProperties} />{c} ct<br />{mm(c)} mm</div>)}</div></div>
  );
  if (i === 2) return (
    <div className="dm-blk r"><span className="eyebrow">Private appointment</span><h4>See it before you decide.</h4><p>Our showroom on Fifth Avenue, or a virtual appointment with the stone held up to the camera.</p><Link href="/#contact" className="dm-btn">Book an appointment</Link></div>
  );
  if (i === 3) return (
    <div className="dm-blk b"><span className="eyebrow">Always included</span><h4>IGI certified. Free insured shipping.</h4><div className="pills"><span>30-day free returns</span><span>Lifetime warranty</span><span>Fifth Avenue showroom</span></div></div>
  );
  return (
    <div className="dm-blk a"><span className="eyebrow">Fancy colours</span><h4>Or choose a colour.</h4><p>Yellow, pink, blue and green, grown the same way.</p>
      <div className="gems">{(["Yellow", "Pink", "Blue", "Green"] as const).map(c => <Link key={c} href={`/diamonds?color=${c}`} aria-label={`Fancy ${c.toLowerCase()} diamonds`}><Image src={DIAMOND[c]} alt="" width={120} height={120} sizes="64px" quality={80} /></Link>)}</div></div>
  );
}
