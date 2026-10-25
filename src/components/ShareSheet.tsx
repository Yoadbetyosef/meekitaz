"use client";
import { useEffect, useState } from "react";
import type { WishItem } from "@/lib/wish";
import { toast } from "./Toast";

/* "Drop a hint": share one piece as a little love note written for who it's going to. The link opens the piece with the note on top. */
const WHO: { k: string; label: string; note: string }[] = [
  { k: "partner", label: "💍 My partner", note: "Psst… I’d say yes to this." },
  { k: "bestie", label: "👯 My bestie", note: "Thoughts? Be brutally honest." },
  { k: "mom", label: "🌷 Mom", note: "Look what I found!" },
  { k: "me", label: "🔖 Just a link", note: "" },
];
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
        <div className="ss-who">{WHO.map(x => <button key={x.k} className={x.k === who ? "on" : ""} onClick={() => setWho(x.k)}>{x.label}</button>)}</div>
        <div className="ss-note">
          <span className="ph" style={{ backgroundImage: `url(${it.image})` }} />
          <div className="tx">{w.note ? <>“{w.note}”</> : it.title}{who === "partner" && withSize && <em>my size is {frac(size)} 😉</em>}<small>{it.title} · {usd(it.price)}</small></div>
        </div>
        {who === "partner" && <label className="ss-size"><input type="checkbox" checked={withSize} onChange={e => setWithSize(e.target.checked)} /> Include my ring size {withSize && <select value={size} onChange={e => setSize(Number(e.target.value))}>{SIZES.map(s => <option key={s} value={s}>{frac(s)}</option>)}</select>}</label>}
        <div className="ss-ways">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" onClick={persist}><span style={{ background: "#DFF5E6" }}>💬</span>WhatsApp</a>
          <a href={`sms:?&body=${encodeURIComponent(text)}`} onClick={persist}><span style={{ background: "#DCEBF4" }}>✉️</span>Messages</a>
          <a href={`mailto:?subject=${encodeURIComponent(w.note || it.title)}&body=${encodeURIComponent(text)}`} onClick={persist}><span style={{ background: "#F7D3DA" }}>💌</span>Email</a>
          {canNative ? <button onClick={() => { persist(); native(); }}><span style={{ background: "#E9DDF3" }}>📷</span>Instagram & more</button>
            : <button onClick={() => { persist(); copy(); toast("Link copied: paste it in your Instagram story or DM"); }}><span style={{ background: "#E9DDF3" }}>📷</span>Instagram</button>}
          <button onClick={() => { persist(); copy(); }}><span style={{ background: "#F7E9A8" }}>🔗</span>Copy link</button>
        </div>
      </div>
    </>
  );
}
