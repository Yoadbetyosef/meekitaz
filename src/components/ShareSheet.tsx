"use client";
import { useEffect, useState } from "react";
import type { WishItem } from "@/lib/wish";
import { toast } from "./Toast";

/* "Drop a hint": share one piece as a little love note written for who it's going to. The link opens the piece with the note on top. */
const WHO: { k: string; label: string; note: string; ic: "ring" | "two" | "flower" | "bm" }[] = [
  { k: "partner", label: "My partner", note: "Psst… I’d say yes to this.", ic: "ring" },
  { k: "bestie", label: "My bestie", note: "Thoughts? Be brutally honest.", ic: "two" },
  { k: "mom", label: "Mom", note: "Look what I found!", ic: "flower" },
  { k: "me", label: "Just a link", note: "", ic: "bm" },
];
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Ic = {
  wa: <svg viewBox="0 0 24 24" {...S}><path d="M3.8 20.2l1.3-3.9A8.3 8.3 0 1 1 8 19.1z" /><path d="M8.9 8.3c.2-.5.5-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.2.7l-.5.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.5c.2-.2.4-.3.7-.2l1.6.7c.3.1.4.3.4.5v.5c0 .4-.2.7-.6.9-.6.3-1.4.4-2.2.1-2.3-.8-4.2-2.7-5-5-.3-.8-.2-1.5.1-2z" /></svg>,
  msg: <svg viewBox="0 0 24 24" {...S}><path d="M12 4.5c4.7 0 8.5 3 8.5 6.8S16.7 18 12 18c-.9 0-1.8-.1-2.6-.3L5 19.8l1.2-3.4C4.5 15.1 3.5 13.3 3.5 11.3 3.5 7.5 7.3 4.5 12 4.5z" /></svg>,
  mail: <svg viewBox="0 0 24 24" {...S}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></svg>,
  ig: <svg viewBox="0 0 24 24" {...S}><rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.8" /><circle cx="12" cy="12" r="3.9" /><circle cx="17.1" cy="6.9" r=".6" fill="currentColor" /></svg>,
  link: <svg viewBox="0 0 24 24" {...S}><path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></svg>,
  ring: <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="15" r="5.5" /><path d="M9.6 6.2 12 9.5l2.4-3.3L13 4h-2z" /></svg>,
  two: <svg viewBox="0 0 24 24" {...S}><circle cx="8.5" cy="8.5" r="3" /><circle cx="15.5" cy="8.5" r="3" /><path d="M3.5 19c.6-2.8 2.6-4.5 5-4.5s4.4 1.7 5 4.5M10.5 19c.6-2.8 2.6-4.5 5-4.5s4.4 1.7 5 4.5" /></svg>,
  flower: <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="9" r="2" /><path d="M12 7c0-2.5 3-3 3 0M14 9c2.5 0 3 3 0 3M12 11c0 2.5-3 3-3 0M10 9c-2.5 0-3-3 0-3M12 11v9M12 17c-2-1.5-4-1.5-5 0M12 15.5c2-1.5 4-1.5 5 0" /></svg>,
  bm: <svg viewBox="0 0 24 24" {...S}><path d="M7 4.5h10v15l-5-3.5-5 3.5z" /></svg>,
};
const SIZES = Array.from({ length: 33 }, (_, i) => 4 + i * 0.25);
const frac = (s: number) => { const w = Math.floor(s), f = Math.round((s - w) * 100); return `${w}${f === 25 ? "¼" : f === 50 ? "½" : f === 75 ? "¾" : ""}`; };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function ShareSheet() {
  const [it, setIt] = useState<WishItem | null>(null);
  const [who, setWho] = useState("partner"); const [withSize, setWithSize] = useState(false); const [size, setSize] = useState(6);
  useEffect(() => {
    const on = (e: Event) => { setIt((e as CustomEvent<WishItem>).detail); try { const s = localStorage.getItem("mk_size"); if (s) setSize(Number(s)); } catch { /* */ } };
    window.addEventListener("mk-share", on); return () => window.removeEventListener("mk-share", on);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("sw-open", !!it); }, [it]);
  if (!it) return null;
  const w = WHO.find(x => x.k === who)!;
  const q = new URLSearchParams(); if (w.note) { q.set("hint", w.note); q.set("from", who); } if (who === "partner" && withSize) q.set("size", String(size));
  const url = `${location.origin}/products/${it.handle}${q.toString() ? `?${q}` : ""}`;
  const text = `${w.note ? w.note + "\n" : ""}${it.title}${who === "partner" && withSize ? ` (my size is ${frac(size)})` : ""}\n${url}`;
  const close = () => setIt(null);
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast("Link copied ✓"); } catch { toast(url); } };
  const native = async () => {
    try {
      const img = await fetch(it.image).then(r => r.blob()).then(b => new File([b], "meekitaz.jpg", { type: b.type || "image/jpeg" })).catch(() => null);
      const data: ShareData = { title: it.title, text: text.replace(url, "").trim(), url };
      if (img && navigator.canShare?.({ files: [img] })) data.files = [img];
      await navigator.share(data);
    } catch { /* cancelled */ }
  };
  const canNative = typeof navigator !== "undefined" && !!navigator.share;
  const persist = () => { try { if (withSize) localStorage.setItem("mk_size", String(size)); } catch { /* */ } };
  return (
    <>
      <div className="ss-dim" onClick={close} />
      <div className="ss" role="dialog" aria-modal="true" aria-label="Share this piece">
        <button className="sw-x" onClick={close} aria-label="Close">×</button>
        <h3>Share this piece</h3><p className="ss-s">Who is it for?</p>
        <div className="ss-who">{WHO.map(x => <button key={x.k} className={x.k === who ? "on" : ""} onClick={() => setWho(x.k)}>{Ic[x.ic]}{x.label}</button>)}</div>
        <div className="ss-note">
          <span className="ph" style={{ backgroundImage: `url(${it.image})` }} />
          <div className="tx">{w.note ? <>“{w.note}”</> : it.title}{who === "partner" && withSize && <em>my size is {frac(size)} 😉</em>}<small>{it.title} · {usd(it.price)}</small></div>
        </div>
        {who === "partner" && <label className="ss-size"><input type="checkbox" checked={withSize} onChange={e => setWithSize(e.target.checked)} /> Include my ring size {withSize && <select value={size} onChange={e => setSize(Number(e.target.value))}>{SIZES.map(s => <option key={s} value={s}>{frac(s)}</option>)}</select>}</label>}
        <div className="ss-ways">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" onClick={persist}><i>{Ic.wa}</i>WhatsApp</a>
          <a href={`sms:?&body=${encodeURIComponent(text)}`} onClick={persist}><i>{Ic.msg}</i>Messages</a>
          <a href={`mailto:?subject=${encodeURIComponent(w.note || it.title)}&body=${encodeURIComponent(text)}`} onClick={persist}><i>{Ic.mail}</i>Email</a>
          {canNative ? <button onClick={() => { persist(); native(); }}><i>{Ic.ig}</i>Instagram</button>
            : <button onClick={() => { persist(); copy(); toast("Link copied: paste it in your Instagram story or DM"); }}><i>{Ic.ig}</i>Instagram</button>}
          <button onClick={() => { persist(); copy(); }}><i>{Ic.link}</i>Copy link</button>
        </div>
      </div>
    </>
  );
}
