"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { usePathname } from "next/navigation";

const KEY = "mk_bag_email";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Builds the saved-bag payload from what is in the bag right now. */
function useBagPayload() {
  const { cart, rings } = useCart();
  const items = [
    ...rings.map(r => ({ title: r.setting.title, sub: `${r.stone.carat.toFixed(2)} ct ${r.stone.shape}${r.stone.color ? ` · ${r.stone.color}` : ""}${r.stone.clarity ? ` · ${r.stone.clarity}` : ""}`, price: r.setting.price + r.stone.price, image: r.setting.image, url: `/diamonds/${r.stone.vendor}-${encodeURIComponent(r.stone.stock)}` })),
    ...(cart?.lines || []).filter(l => !l.handle.startsWith("care-package") && l.handle !== "express-shipping-3-5-days").map(l => ({ title: l.title.replace(/ \((?:[^()]*)\)$/, ""), sub: l.variantTitle || undefined, price: l.price * l.quantity, image: l.image?.url, url: `/products/${l.handle}` })),
  ];
  const total = items.reduce((s, i) => s + i.price, 0);
  return { items, rings: rings.map(r => ({ setting: r.setting, stone: r.stone })), total };
}

/** "Email me my bag": one input in the bag. Saves the bag, emails the link now, and a reminder follows in 24 h. */
export function SaveBagRow() {
  const p = useBagPayload();
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { setHidden(!!localStorage.getItem(KEY)); } catch { /* ignore */ } }, []);
  if (!p.items.length || hidden) return null;
  const go = async () => {
    if (!EMAIL.test(email)) return;
    setState("busy");
    const r = await fetch("/api/bag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, ...p }) }).then(r => r.json()).catch(() => null);
    if (r?.id) { try { localStorage.setItem(KEY, email); } catch { /* ignore */ } setState("sent"); } else setState("idle");
  };
  return (
    <div className="sb-row">
      {state === "sent" ? <p className="sb-ok">Sent to <b>{email}</b>. It’s saved for you.</p> : <>
        <label>Email me my bag <small>so it’s here when you’re ready</small></label>
        <div className="sb-in"><input type="email" inputMode="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} /><button type="button" disabled={state === "busy" || !EMAIL.test(email)} onClick={go}>{state === "busy" ? "…" : "Send"}</button></div>
      </>}
    </div>
  );
}

/** Desktop exit prompt, once per session: a ring is in the bag, no email yet, and the mouse heads for the tab bar. */
export function SaveBagPrompt() {
  const { rings, open } = useCart(); const p = useBagPayload(); const path = usePathname();
  const [show, setShow] = useState(false); const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const shown = useRef(false);
  useEffect(() => {
    if (!rings.length || shown.current) return;
    const on = (e: MouseEvent) => {
      if (e.clientY > 8 || shown.current || open) return;
      try { if (localStorage.getItem(KEY) || sessionStorage.getItem("mk_bag_prompt")) return; sessionStorage.setItem("mk_bag_prompt", "1"); } catch { /* ignore */ }
      shown.current = true; setShow(true);
    };
    document.addEventListener("mouseout", on);
    return () => document.removeEventListener("mouseout", on);
  }, [rings.length, open]);
  if (!show || path?.startsWith("/bag") || path?.startsWith("/daily/checkout")) return null;
  const go = async () => {
    if (!EMAIL.test(email)) return;
    setState("busy");
    const r = await fetch("/api/bag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, ...p }) }).then(r => r.json()).catch(() => null);
    if (r?.id) { try { localStorage.setItem(KEY, email); } catch { /* ignore */ } setState("sent"); setTimeout(() => setShow(false), 1800); } else setState("idle");
  };
  const first = rings[0];
  return (
    <div className="sbp" role="dialog" aria-label="Save your ring">
      <button type="button" className="sbp-x" aria-label="Close" onClick={() => setShow(false)}>×</button>
      {first?.setting.image && <img src={first.setting.image} alt="" />}
      <div>
        <h3>Wait — your ring.</h3>
        {state === "sent" ? <p>Sent to <b>{email}</b>. It’s saved for you.</p> : <>
          <p>We’ll email you a link that brings it right back. No account, no spam.</p>
          <div className="sb-in"><input type="email" inputMode="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} autoFocus /><button type="button" disabled={state === "busy" || !EMAIL.test(email)} onClick={go}>{state === "busy" ? "…" : "Save my ring"}</button></div>
        </>}
      </div>
    </div>
  );
}
