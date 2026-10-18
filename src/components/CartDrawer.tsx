"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartLine } from "@/lib/shopify";
import { clearSetting, clearStone } from "@/lib/setting";
import { useCart } from "./CartProvider";

const SIZES = Array.from({ length: 21 }, (_, i) => 3 + i * 0.5);
const attr = (l: CartLine, k: string) => l.attributes.find(a => a.key === k)?.value;
type Ring = { build: string; setting: CartLine; stone: CartLine; size: string };
const money = (n: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

const Trust = () => (
  <div className="trust">
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>Free insured shipping</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" /></svg>30-day free returns</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>Lifetime warranty</div>
  </div>
);

export default function CartDrawer() {
  const { cart, open, busy, setOpen, setQty, remove, setRingSize, removeRing } = useCart();
  const router = useRouter();
  const lines = cart?.lines ?? [];
  // a ring = a setting line (has the "Diamond" note) and its diamond line, tied together by the same "Build" id
  const builds = new Map<string, CartLine[]>();
  lines.forEach(l => { const b = attr(l, "Build"); if (b) builds.set(b, [...(builds.get(b) || []), l]); });
  const rings: Ring[] = [...builds.entries()].filter(([, ls]) => ls.length === 2).map(([build, ls]) => {
    const setting = ls.find(l => attr(l, "Diamond")) || ls[0], stone = ls.find(l => l !== setting) || ls[1];
    return { build, setting, stone, size: attr(setting, "Ring size") || attr(stone, "Ring size") || "" };
  });
  const inRing = new Set(rings.flatMap(r => [r.setting.id, r.stone.id]));
  const plain = lines.filter(l => !inRing.has(l.id));
  const needSize = rings.some(r => !r.size);
  const shapeOf = (r: Ring) => r.stone.title.match(/ct (\w+) lab-grown/i)?.[1] || "";
  async function changeSetting(r: Ring) { const sh = shapeOf(r); await removeRing([r.setting.id, r.stone.id]); clearSetting(); setOpen(false); router.push(`/engagement-rings${sh ? `?style=${encodeURIComponent(sh)}&build=1` : ""}`); }
  async function changeDiamond(r: Ring) { const sh = shapeOf(r); await removeRing([r.setting.id, r.stone.id]); clearStone(); setOpen(false); router.push(`/diamonds?${sh ? `style=${encodeURIComponent(sh)}&` : ""}c=2-20&build=1`); }
  async function removeWholeRing(r: Ring) { await removeRing([r.setting.id, r.stone.id]); clearSetting(); clearStone(); }
  const count = cart?.totalQuantity ?? 0;

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [open, setOpen]);

  return (
    <>
      <div className={`cdov${open ? " on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`cdrawer${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden={!open}>
        <div className="cd-top">
          <h3>Your bag<span>{count} item{count === 1 ? "" : "s"}</span></h3>
          <button className="cd-x" onClick={() => setOpen(false)} aria-label="Close bag">×</button>
        </div>
        <div className="cd-body">
          {lines.length === 0 ? (
            <div className="cd-empty"><p>Your bag is empty. For now.</p><Link href="/engagement-rings" onClick={() => setOpen(false)}>Shop engagement rings</Link></div>
          ) : (<>
            {rings.map(r => (
              <div className="cd-ring" key={r.build} style={{ opacity: busy ? .6 : 1 }}>
                <div className="cd-rh"><b>Your ring</b><button className="cd-rm" onClick={() => removeWholeRing(r)} disabled={busy}>Remove ring</button></div>
                <div className="cd-li">
                  <Link href={`/products/${r.setting.handle}`} className="cd-im" onClick={() => setOpen(false)}>{r.setting.image && <Image src={r.setting.image.url} alt={r.setting.image.alt} fill sizes="92px" />}</Link>
                  <div><h4>{r.setting.title}</h4><div className="cd-meta">Setting</div><button className="cd-chg" onClick={() => changeSetting(r)} disabled={busy}>Change setting</button></div>
                  <div className="cd-pr">{money(r.setting.price, cart?.currency)}</div>
                </div>
                <div className="cd-li">
                  <div className="cd-im cd-gem"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg></div>
                  <div><h4>{r.stone.title.replace(/ \(.*\)$/, "")}</h4><div className="cd-meta">{attr(r.setting, "Diamond")?.split(" · ").slice(1).join(" · ")}</div><button className="cd-chg" onClick={() => changeDiamond(r)} disabled={busy}>Change diamond</button></div>
                  <div className="cd-pr">{money(r.stone.price, cart?.currency)}</div>
                </div>
                <div className={`cd-size${r.size ? "" : " need"}`}>
                  <label htmlFor={`sz-${r.build}`}>Ring size (US)</label>
                  <select id={`sz-${r.build}`} value={r.size} disabled={busy} onChange={e => setRingSize([r.setting.id, r.stone.id], e.target.value)}>
                    <option value="">Select your size</option>{SIZES.map(z => <option key={z} value={String(z)}>{z}</option>)}
                  </select>
                  <Link href="/#contact" onClick={() => setOpen(false)}>Not sure? Book a free sizing appointment</Link>
                </div>
                <div className="cd-rt"><span>Ring total</span><b>{money(r.setting.price + r.stone.price, cart?.currency)}</b></div>
              </div>
            ))}
            {plain.map(l => (
              <div className="cd-li" key={l.id} style={{ opacity: busy ? .6 : 1 }}>
                <Link href={`/products/${l.handle}`} className="cd-im" onClick={() => setOpen(false)}>
                  {l.image && <Image src={l.image.url} alt={l.image.alt} fill sizes="92px" />}
                </Link>
                <div>
                  <h4>{l.title}</h4>
                  {l.variantTitle && <div className="cd-meta">{l.variantTitle}</div>}
                  {l.compareAt > 0 && <span className="cd-tag">50% off · made to order</span>}
                  <div className="cd-qty">
                    <button onClick={() => setQty(l.id, l.quantity - 1)} aria-label="Decrease quantity" disabled={busy}>−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => setQty(l.id, l.quantity + 1)} aria-label="Increase quantity" disabled={busy}>+</button>
                  </div>
                  <button className="cd-rm" onClick={() => remove(l.id)} disabled={busy}>Remove</button>
                </div>
                <div className="cd-pr">{money(l.price * l.quantity, cart?.currency)}{l.compareAt > 0 && <s>{money(l.compareAt * l.quantity, cart?.currency)}</s>}</div>
              </div>
            ))}
          </>)}
        </div>
        {cart && lines.length > 0 && (
          <div className="cd-foot">
            <div className="cd-sum">
              <div><span>Subtotal</span><span>{money(cart.subtotal, cart.currency)}</span></div>
              {cart.savings > 0 && <div className="save"><span>You save</span><span>−{money(cart.savings, cart.currency)}</span></div>}
              <div><span>Shipping</span><span>Free · insured</span></div>
              <div><small>Taxes calculated at checkout</small></div>
              <div className="t"><span>Total</span><span>{money(cart.subtotal, cart.currency)}</span></div>
            </div>
            {needSize ? <button className="cd-co" disabled>Select your ring size to continue</button> : <a className="cd-co" href={cart.checkoutUrl}>Checkout</a>}
            <p className="cd-pay">Secure checkout with Shop Pay, Apple Pay and cards</p>
            <Trust />
          </div>
        )}
      </aside>
    </>
  );
}
