"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { useCart } from "./CartProvider";
import { toast } from "./Toast";
import { loadSetting, chooseStone, settingFrom, sameShape, baseShape, type Setting, type Stone } from "@/lib/setting";
import SwapDrawer from "./SwapDrawer";
import WishHeart, { ShareArrow } from "./WishHeart";
import { DailyLine, DailyTotal } from "./DailyPrice";
import { saveSetting } from "@/lib/setting";
import { isGoldMetal, karatStep } from "@/lib/karat";
import { fancyColorOfStone, fancySettingsUrl } from "@/lib/fancy";
import { showroomImage } from "@/lib/data";

export type FlowStone = {
  vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null; cut: string | null; polish: string | null; symmetry: string | null; fluor: string | null;
  lab: string; cert: string; certUrl: string; image: string; video: string | null; embed: string | null; price: number; fancy: string | null; ratio: string | null; depth: string | null; table: string | null; measurements: string | null;
};
export type Similar = FlowStone & { bg: string };

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const title = (d: FlowStone) => `${d.carat.toFixed(2)} ct ${d.shape}`;
const sub = (d: FlowStone) => [d.fancy ? d.fancy : d.color && `${d.color} color`, d.clarity && `${d.clarity} clarity`, d.cut && `${d.cut} cut`].filter(Boolean).join(" · ");
const nums = (d: FlowStone) => (String(d.measurements || "").match(/[\d.]+/g) || []).map(Number);
const perCarat = (d: FlowStone) => `${usd(d.price / d.carat)} per carat`;
const COL = ["D", "E", "F", "G", "H", "I", "J", "K"], CLR = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];

function Icon360() { return <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="4.2" /><path d="M20.4 9.1l1.7 2.3-2.8.5" /></svg>; }

/** The diamond's photograph in a window the colour of its own backdrop, with the small 360° chip when the stone has a video. */
function StoneWindow({ d, bg, alt, children }: { d: FlowStone; bg: string; alt: string; children?: React.ReactNode }) {
  const [vid, setVid] = useState(false);
  return (
    <div className="df-win" style={{ "--bgc": bg } as React.CSSProperties}>
      {vid && d.embed
        ? <iframe src={d.embed} title="360° view of the diamond" scrolling="no" allow="autoplay" className="df-vid" />
        : <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.image} alt={alt} referrerPolicy="no-referrer" />
        </>}
      {d.embed
        ? <button type="button" className="df-360" aria-pressed={vid} aria-label={vid ? "Back to the photo" : "See the diamond turn, 360 degrees"} onClick={() => setVid(v => !v)}><Icon360 /><span>{vid ? "Photo" : "360°"}</span></button>
        : d.video ? <a className="df-360" href={d.video} target="_blank" rel="noopener noreferrer" aria-label="See the diamond turn, 360 degrees (opens a video)"><Icon360 /><span>360°</span></a> : null}
      {children}
    </div>
  );
}

export default function DiamondFlow({ d, bg, similar }: { d: FlowStone; bg: string; similar: Similar[] }) {
  const router = useRouter(); const { addRing } = useCart();
  const [set, setSet] = useState<Setting | null>(null);       // what the customer chose in step 1
  const [shown, setShown] = useState<Setting | null>(null);   // that same design in this diamond's shape
  const [missing, setMissing] = useState(false);
  const [ch, setCh] = useState(0);
  const track = useRef<HTMLDivElement>(null), drag = useRef<{ x: number; y: number; t: number; lock: boolean } | null>(null), swallow = useRef(false), chRef = useRef(0), close = useRef<HTMLElement>(null), reel = useRef<HTMLVideoElement>(null);
  const [hint, setHint] = useState(true);
  const shape = d.shape === "Elongated Cushion" ? "Cushion" : d.shape;
  const fc = fancyColorOfStone(d.fancy);
  const pickUrl = fc ? fancySettingsUrl(fc, shape) : `/engagement-rings?style=${encodeURIComponent(shape)}&build=1`;

  const [swap, setSwap] = useState<"setting" | "stone" | null>(null);
  const [note, setNote] = useState<{ text: string; size: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = q.get("setting"), k = q.get("k") || "";
    if (h) fetch(`/api/setting?handle=${encodeURIComponent(h)}`).then(r => r.json()).then(j => {
      if (!j.item || !j.ns) return; const it = j.item, kk = k && isGoldMetal(it.metal) ? k : "";
      saveSetting({ ns: j.ns, handle: it.handle, variantId: it.variantId, title: it.title, shape: it.shape, metal: it.metal, price: it.price + (kk ? karatStep(j.ns, kk) : 0), image: it.images[0] || "", karat: kk || undefined });
    }).catch(() => {});
    const t = q.get("hint"); if (t) { const z = Number(q.get("size")); const w = Math.floor(z), f = Math.round((z - w) * 100); setNote({ text: t.slice(0, 160), size: z ? `${w}${f === 25 ? "¼" : f === 50 ? "½" : f === 75 ? "¾" : ""}` : "" }); }
  }, []);
  useEffect(() => { const read = () => setSet(loadSetting()); read(); window.addEventListener("mk-setting", read); return () => window.removeEventListener("mk-setting", read); }, []);
  useEffect(() => {
    let off = false; setMissing(false);
    if (!set) { setShown(null); return; }
    // the setting follows the diamond: its shape AND its colour (a pink diamond shows the pink version of the design)
    if (sameShape(set.shape, d.shape) && (set.color || "") === (fc || "")) { setShown(set); return; }
    setShown(null);
    const ask = (color: string) => fetch(`/api/setting?${new URLSearchParams({ ns: set.ns, shape: baseShape(d.shape), metal: set.metal, color })}`).then(r => r.json());
    ask(fc || "").then(j => j.item ? { ...j, color: fc || "" } : sameShape(set.shape, d.shape) ? { item: null, keep: true } : ask(set.color || "").then(k => ({ ...k, color: set.color || "" })))
      .then((j: { item?: unknown; keep?: boolean; color?: string }) => { if (off) return; if (j.keep) { setShown(set); return; } if (j.item) setShown({ ...settingFrom(set, j.item as Parameters<typeof settingFrom>[1]), color: j.color || undefined }); else setMissing(true); })
      .catch(() => { if (!off) setMissing(true); });
    return () => { off = true; };
  }, [set, d.shape, fc]);

  // the story: five cards. One swipe moves exactly one card; the card follows the finger and settles at the left edge, under the photograph
  const place = (i: number, dx = 0, animate = true) => {
    const t = track.current; if (!t) return;
    const step = t.children.length > 1 ? (t.children[1] as HTMLElement).offsetLeft - (t.children[0] as HTMLElement).offsetLeft : 0;
    t.style.transition = animate ? "transform .5s cubic-bezier(.2,.8,.2,1)" : "none"; t.style.transform = `translate3d(${-i * step + dx}px,0,0)`;
  };
  const slide = (k: number) => { const n = Math.max(0, Math.min(4, k)); chRef.current = n; setCh(n); if (n > 0) setHint(false); place(n); };
  useEffect(() => { chRef.current = ch; place(ch); }, [ch]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const on = () => place(chRef.current, 0, false); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const onDown = (e: React.PointerEvent) => { if (e.pointerType === "mouse" && e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, t: Date.now(), lock: false }; };
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current; if (!g) return; const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.lock) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { g.lock = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } }
      else { if (Math.abs(dy) > 10) drag.current = null; return; }
    }
    const i = chRef.current; place(i, (i === 0 && dx > 0) || (i === 4 && dx < 0) ? dx * 0.3 : dx, false);
  };
  const onUp = (e: React.PointerEvent) => {
    const g = drag.current; drag.current = null; if (!g || !g.lock) return;
    swallow.current = true; setTimeout(() => { swallow.current = false; }, 80);
    const dx = e.clientX - g.x, v = Math.abs(dx) / Math.max(1, Date.now() - g.t), i = chRef.current;
    slide(dx < -40 || (dx < -14 && v > 0.4) ? i + 1 : dx > 40 || (dx > 14 && v > 0.4) ? i - 1 : i);
  };
  // the reel loads and plays only while it is near the screen
  useEffect(() => {
    const el = close.current, v = reel.current; if (!el || !v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!v.getAttribute("src")) v.setAttribute("src", "/media/brand-reel.mp4"); if (!reduce) v.play().catch(() => {}); } else v.pause();
    }), { rootMargin: "300px 0px", threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const stone: Stone = { vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, lab: d.lab, image: d.image, price: d.price, fancy: d.fancy };
  const go = () => chooseStone(stone, { push: u => router.push(u), addRing, notify: toast });
  const total = d.price + (shown ? shown.price : 0);
  const ctaText = shown ? "Add to bag" : "Choose this diamond";
  const sTitle = shown ? shown.title.replace(/^(Yellow|White|Rose) gold /i, "").replace(new RegExp(`^${shape} Diamond `, "i"), "") : "";
  const sMetal = shown ? [shown.karat, shown.metal].filter(Boolean).join(" ") : "";
  const n = nums(d), mmw = n.length > 1 ? Math.min(78, Math.round(n[0] * 7.5)) : 40;
  const kind = d.fancy ? "fancy color" : "";

  return (
    <>
      {note && <div className="hint-note" role="note"><button aria-label="Close" onClick={() => setNote(null)}>×</button><small>A note for you</small><p>“{note.text}”</p>{note.size && <span>Her ring size: {note.size}</span>}</div>}
      <SwapDrawer mode={swap} shape={d.shape} setting={shown || null} stone={stone} onClose={() => setSwap(null)} />
      {/* 1 · build your ring */}
      <section className="df-bd">
        <div className="df-h"><span className="eyebrow">{d.fancy ? "Fancy color" : "Step 2 of 3"} · Your diamond</span><h1>Build your ring</h1><p className="df-s">{title(d)} · {sub(d)}</p></div>
        <div className="df-g">
          <div className="df-pair">
            <div>
              <div className="df-card"><span className="df-cap">Your diamond</span><StoneWindow d={d} bg={bg} alt={`${d.carat.toFixed(2)} carat ${d.shape} diamond`} /></div>
              <div className="df-capt"><b>{title(d)}</b>{usd(d.price)} · {d.lab} certified<DailyLine price={d.price} className="cap" />{shown && <button type="button" className="df-swap" onClick={() => setSwap("stone")}>⇄ Swap diamond</button>}</div>
            </div>
            <div className="df-plus">+</div>
            <div>
              <div className="df-card">
                <span className="df-cap">{shown ? "Your setting" : "Setting"}</span>
                {shown && shown.image
                  ? <Image src={shown.image} alt={shown.title} fill sizes="(max-width:767px) 44vw, 28vw" quality={75} className="df-set" />
                  : <div className="df-none">{missing ? `That setting is not made in ${shape.toLowerCase()}.` : set ? "Finding your setting…" : "Choose a setting for this diamond"}<Link href={pickUrl} className="df-pill">{missing || !set ? "Choose a setting" : "See settings"}</Link></div>}
              </div>
              <div className="df-capt"><b>{shown ? sTitle : "No setting yet"}</b>{shown ? `from ${usd(shown.price)}${sMetal ? " · " + sMetal : ""}` : `For your ${shape.toLowerCase()} diamond`}{shown && <button type="button" className="df-swap" onClick={() => setSwap("setting")}>⇄ Swap setting</button>}</div>
            </div>
          </div>
          <aside className="df-sum">
            {shown && (() => { const design = { kind: "design" as const, handle: `design-${shown.handle}-${d.vendor}-${String(d.stock).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.slice(0, 190), title: `${shown.title.replace(/^(Yellow gold|White gold|Rose gold|Platinum)\s+/i, "")} + ${title(d)}`, image: shown.image, stoneImage: d.image, price: total, url: `/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}?setting=${encodeURIComponent(shown.handle)}${shown.karat ? `&k=${shown.karat}` : ""}` };
              return <div className="df-acts"><WishHeart item={design} /><ShareArrow item={design} /></div>; })()}
            <h3>Your ring</h3>
            <div className="df-ln"><span>{title(d)}<em>{sub(d)}</em></span><b>{usd(d.price)}</b></div>
            <div className="df-ln"><span>{shown ? shown.title : "No setting yet"}<em>{shown ? `Setting${sMetal ? ", " + sMetal : ""}` : "Pick one to see the total"}</em></span><b>{shown ? usd(shown.price) : "—"}</b></div>
            <div className="df-tot"><span>Total</span><b>{usd(total)}</b></div>
            <DailyTotal price={total} label={shown ? "Your ring" : "Your diamond"} />
            <button type="button" className="df-cta" onClick={go}>{ctaText}</button>
            <Link href="/#contact" className="df-cta o">Book a private appointment</Link>
            <div className="df-trust"><span>IGI / GIA certified, every stone</span><span>30-day free returns</span><span>Lifetime warranty</span><span>Free insured shipping</span></div>
          </aside>
        </div>
      </section>

      {/* 2 · the story of this stone: swipe through five cards */}
      <section className="df-st" aria-label="The story of this diamond">
        <div className="df-pin">
          <Logo className="df-bglogo" />
          <div className={`df-stage c${ch}`}>
            <div className="df-win" style={{ "--bgc": bg } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="df-loupe" />
            <div className="df-ruler"><i /><span>{n.length > 1 ? `${n[0]} × ${n[1]} mm` : ""}</span></div>
            <span className="df-tag">{["Carat", "Colour", "Clarity", "Cut", "Certificate"][ch]}</span>
          </div>
          <div className="df-txt">
            <div className="df-cwrap">
              <button type="button" className="df-arr l" aria-label="Previous" onClick={() => slide(ch - 1)} disabled={ch === 0}>‹</button>
              <button type="button" className="df-arr r" aria-label="Next" onClick={() => slide(ch + 1)} disabled={ch === 4}>›</button>
              <div className="df-cards" role="region" aria-label="The five chapters of this diamond, swipe sideways" tabIndex={0} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; place(chRef.current); }} onClickCapture={e => { if (swallow.current) { e.preventDefault(); e.stopPropagation(); } }} onKeyDown={e => { if (e.key === "ArrowRight") slide(ch + 1); if (e.key === "ArrowLeft") slide(ch - 1); }}>
                <div className="df-track" ref={track}>
                <div className="df-ccard">{hint && <span className="df-swipe">Swipe →</span>}<span className="df-n">01 / 05 · THE STORY OF THIS STONE</span><h2>{d.carat.toFixed(2)} carats.</h2><p>{n.length > 1 ? `About ${n[0]} × ${n[1]} mm face-up. ` : ""}A {d.shape.toLowerCase()} cut, {d.carat >= 2 ? "a substantial stone" : d.carat >= 1 ? "a generous stone" : "a delicate stone"}.</p><div className="df-gg"><div className="df-row"><span>Shape</span><b>{d.shape}</b></div><div className="df-row"><span>Ratio</span><b>{d.ratio || "—"}</b></div></div></div>
                <div className="df-ccard"><span className="df-n">02 / 05</span><h2>{d.fancy ? `${d.fancy.replace(/^Fancy /, "")}.` : `${d.color} colour.`}</h2><p>{d.fancy ? "A saturated fancy colour, grown in a lab." : ["D", "E", "F"].includes(d.color || "") ? "Colourless: pure white in any setting." : "Near-colourless: it reads as white in any setting."}</p>{!d.fancy && <div className="df-gg"><div className="df-scale">{COL.map(c => <i key={c} className={c === d.color ? "on" : ""}>{c}</i>)}</div></div>}</div>
                <div className="df-ccard"><span className="df-n">03 / 05</span><h2>{d.clarity} clarity.</h2><p>{/SI|I1/.test(d.clarity || "") ? "Tiny characteristics you can see up close." : "Eye-clean: any tiny characteristics are only visible under 10× magnification."}</p><div className="df-gg"><div className="df-scale sm">{CLR.map(c => <i key={c} className={c === d.clarity ? "on" : ""}>{c}</i>)}</div></div></div>
                <div className="df-ccard"><span className="df-n">04 / 05</span><h2>{d.cut || d.polish || "Finished"}.</h2><p>How well it was cut, polished and made symmetrical decides how it catches the light.</p><div className="df-gg">{([["Cut", d.cut], ["Polish", d.polish], ["Symmetry", d.symmetry], ["Table", d.table && d.table + "%"], ["Depth", d.depth && d.depth + "%"]] as [string, string | null][]).filter(r => r[1]).map(([k, v]) => <div key={k} className="df-row"><span>{k}</span><b>{v}</b></div>)}</div></div>
                <div className="df-ccard"><span className="df-n">05 / 05</span><h2>Certified.</h2><div className="df-gg"><div className="df-cert"><b>{d.lab} {d.cert}</b><span>Independently graded. {perCarat(d)}.</span><a href={d.certUrl} target="_blank" rel="noopener noreferrer">View the certificate →</a></div><button type="button" className="df-cta" onClick={go}>{shown ? `Add to bag · ${usd(total)}` : `Choose this diamond · ${usd(d.price)}`}</button></div></div>
                </div>
              </div>
            </div>
            <div className="df-dots">{[0, 1, 2, 3, 4].map(i => <button key={i} type="button" aria-label={`Chapter ${i + 1}`} className={i === ch ? "on" : ""} onClick={() => slide(i)} />)}</div>
          </div>
        </div>
      </section>

      {/* 3 · the ending */}
      {similar.length > 0 && (
        <section className="df-sec">
          <span className="eyebrow">Similar stones</span><h2>Other {shape.toLowerCase()} {kind && kind + " "}diamonds you may like</h2>
          <div className="df-sim">
            {similar.map(x => {
              const dc = x.carat - d.carat, dp = x.price - d.price;
              return (
                <Link key={`${x.vendor}-${x.stock}`} href={`/diamonds/${x.vendor}-${encodeURIComponent(x.stock)}`}>
                  <div className="df-im" style={{ "--bgc": x.bg } as React.CSSProperties}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.image} alt={`${x.carat.toFixed(2)} carat ${x.shape} diamond`} referrerPolicy="no-referrer" loading="lazy" /></div>
                  <div className="df-tx"><b>{x.carat.toFixed(2)} ct</b><span>{x.fancy || `${x.color} · ${x.clarity}`} · {x.lab}</span><span className="df-pr">{usd(x.price)}</span><em>{dc >= 0 ? "+" : "−"}{Math.abs(dc).toFixed(2)} ct · {dp >= 0 ? "+" : "−"}{usd(Math.abs(dp))}</em></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="df-sec">
        <div className="df-see">
          <Image src={showroomImage} alt="The Meekitaz showroom" width={900} height={900} sizes="(max-width:767px) 100vw, 50vw" quality={75} />
          <div className="df-tx">
            <span className="eyebrow">See it first</span><h2>Come and see it, or have us show you on camera.</h2>
            <div className="df-addr">Fifth Avenue, New York</div>
            <p>By appointment, with the stone and the settings in front of you. Or a virtual appointment: we hold it up to the camera and talk you through it.</p>
            <div className="df-btns"><Link href="/#contact" className="df-cta">Book a private appointment</Link><Link href="/#contact" className="df-cta o">Virtual appointment</Link></div>
          </div>
        </div>
      </section>

      <section className="df-sec">
        <div className="df-band">
          <Logo className="df-bandlogo" />
          <div><span className="eyebrow">Your ring</span><h2>Ready when you are.</h2><p>{title(d)}{shown ? ` in the ${sTitle}${sMetal ? ", " + sMetal : ""}` : ""}</p></div>
          <div className="df-r"><div className="df-big">{usd(total)}</div><button type="button" className="df-cta" onClick={go}>{ctaText}</button><small>Free insured shipping · 30-day free returns · Lifetime warranty</small></div>
        </div>
        <div className="df-icons"><div><b>IGI / GIA</b>Every stone independently certified</div><div><b>30 days</b>Free returns</div><div><b>For life</b>Warranty on every piece</div><div><b>Free</b>Insured shipping</div></div>
      </section>

      <section className="df-close" ref={close} aria-label="Meekitaz">
        <div><Logo className="df-closelogo" /><p>Serious diamonds, worn lightly.</p></div>
        <div className="df-reel"><video ref={reel} muted loop playsInline preload="none" poster="/media/brand-reel-poster.jpg" aria-label="Meekitaz, a short film" /></div>
      </section>

      {/* phone: the total and the button stay in reach */}
      <div className="df-sbar"><b>{usd(total)}<DailyLine price={total} className="sb" /></b><button type="button" className="df-cta" onClick={go}>{shown ? "Add to bag" : "Choose diamond"}</button></div>
    </>
  );
}
