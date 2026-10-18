"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartLine } from "@/lib/shopify";
import { clearSetting, clearStone, saveSetting, saveStone } from "@/lib/setting";
import { useCart } from "./CartProvider";

const SIZES = Array.from({ length: 21 }, (_, i) => 3 + i * 0.5);
const attr = (l: CartLine, k: string) => l.attributes.find(a => a.key === k)?.value;
type CartRing = { build: string; setting: CartLine; stone: CartLine; size: string };
const money = (n: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

const Trust = () => (
  <div className="trust">
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>Free insured shipping</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" /></svg>30-day free returns</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>Lifetime warranty</div>
  </div>
);

export default function CartDrawer() {
  const { cart, open, busy, setOpen, setQty, remove, rings, ringError, bagCount, setRingSize, removeRing, setCartRingSize, removeCartRing, checkout } = useCart();
  const router = useRouter();
  const lines = cart?.lines ?? [];
  // rings that already reached Shopify: a setting line (has the "Diamond" note) and its diamond line, tied by the same "Build" id
  const builds = new Map<string, CartLine[]>();
  lines.forEach(l => { const b = attr(l, "Build"); if (b) builds.set(b, [...(builds.get(b) || []), l]); });
  const cartRings: CartRing[] = [...builds.entries()].filter(([, ls]) => ls.length === 2).map(([build, ls]) => {
    const setting = ls.find(l => attr(l, "Diamond")) || ls[0], stone = ls.find(l => l !== setting) || ls[1];
    return { build, setting, stone, size: attr(setting, "Ring size") || attr(stone, "Ring size") || "" };
  });
  const inRing = new Set(cartRings.flatMap(r => [r.setting.id, r.stone.id]));
  const plain = lines.filter(l => !inRing.has(l.id));
  const needSize = rings.some(r => !r.size) || cartRings.some(r => !r.size);
  const ringsTotal = rings.reduce((t, r) => t + r.setting.price + r.stone.price, 0);
  const subtotal = (cart?.subtotal ?? 0) + ringsTotal;
  const cur = cart?.currency || "USD";
  const empty = lines.length === 0 && rings.length === 0;
  const leave = (url: string) => { setOpen(false); router.push(url); };
  const sizeBox = (id: string, value: string, onPick: (v: string) => void) => (
    <div className={`cd-size${value ? "" : " need"}`}>
      <label htmlFor={`sz-${id}`}>Ring size (US)</label>
      <select id={`sz-${id}`} value={value} disabled={busy} onChange={e => onPick(e.target.value)}>
        <option value="">Select your size</option>{SIZES.map(z => <option key={z} value={String(z)}>{z}</option>)}
      </select>
      <Link href="/#contact" onClick={() => setOpen(false)}>Not sure? Book a free sizing appointment</Link>
    </div>
  );

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
          <h3>Your bag<span>{bagCount} item{bagCount === 1 ? "" : "s"}</span></h3>
          <button className="cd-x" onClick={() => setOpen(false)} aria-label="Close bag">×</button>
        </div>
        <div className="cd-body">
          {empty ? (
            <div className="cd-empty"><p>Your bag is empty. For now.</p><Link href="/engagement-rings" onClick={() => setOpen(false)}>Shop engagement rings</Link></div>
          ) : (<>
            {rings.map(r => (
              <div className="cd-ring" key={r.id} style={{ opacity: busy ? .6 : 1 }}>
                <div className="cd-rh"><b>Your ring</b><button className="cd-rm" onClick={() => { removeRing(r.id); }} disabled={busy}>Remove ring</button></div>
                <div className="cd-li">
                  <Link href={`/products/${r.setting.handle}`} className="cd-im" onClick={() => setOpen(false)}>{r.setting.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`${r.setting.image}${r.setting.image.includes("?") ? "&" : "?"}width=200`} alt="" />}</Link>
                  <div><h4>{r.setting.title}</h4><div className="cd-meta">Setting · {r.setting.metal}</div>
                    <button className="cd-chg" onClick={() => { removeRing(r.id); saveStone(r.stone); clearSetting(); leave(`/engagement-rings?style=${encodeURIComponent(r.stone.shape)}&build=1`); }}>Change setting</button></div>
                  <div className="cd-pr">{money(r.setting.price, cur)}</div>
                </div>
                <div className="cd-li">
                  <div className="cd-im cd-st">{r.stone.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.stone.image} alt="" referrerPolicy="no-referrer" />}</div>
                  <div><h4>{r.stone.carat.toFixed(2)} ct {r.stone.shape} diamond</h4><div className="cd-meta">{[r.stone.fancy || r.stone.color, r.stone.clarity, r.stone.cut && `${r.stone.cut} cut`, `${r.stone.lab} certified`].filter(Boolean).join(" · ")}</div>
                    <button className="cd-chg" onClick={() => { removeRing(r.id); saveSetting(r.setting); clearStone(); leave(`/diamonds?style=${encodeURIComponent(r.stone.shape)}&c=2-20&build=1`); }}>Change diamond</button></div>
                  <div className="cd-pr">{money(r.stone.price, cur)}</div>
                </div>
                {sizeBox(r.id, r.size, v => setRingSize(r.id, v))}
                <div className="cd-rt"><span>Ring total</span><b>{money(r.setting.price + r.stone.price, cur)}</b></div>
              </div>
            ))}
            {cartRings.map(r => (
              <div className="cd-ring" key={r.build} style={{ opacity: busy ? .6 : 1 }}>
                <div className="cd-rh"><b>Your ring</b><button className="cd-rm" onClick={() => { removeCartRing([r.setting.id, r.stone.id]); clearSetting(); clearStone(); }} disabled={busy}>Remove ring</button></div>
                <div className="cd-li">
                  <Link href={`/products/${r.setting.handle}`} className="cd-im" onClick={() => setOpen(false)}>{r.setting.image && <Image src={r.setting.image.url} alt={r.setting.image.alt} fill sizes="92px" />}</Link>
                  <div><h4>{r.setting.title}</h4><div className="cd-meta">Setting</div></div><div className="cd-pr">{money(r.setting.price, cur)}</div>
                </div>
                <div className="cd-li">
                  <div className="cd-im cd-gem"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg></div>
                  <div><h4>{r.stone.title.replace(/ \(.*\)$/, "")}</h4><div className="cd-meta">{attr(r.setting, "Diamond")?.split(" · ").slice(1).join(" · ")}</div></div><div className="cd-pr">{money(r.stone.price, cur)}</div>
                </div>
                {sizeBox(r.build, r.size, v => setCartRingSize([r.setting.id, r.stone.id], v))}
                <div className="cd-rt"><span>Ring total</span><b>{money(r.setting.price + r.stone.price, cur)}</b></div>
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
                <div className="cd-pr">{money(l.price * l.quantity, cur)}{l.compareAt > 0 && <s>{money(l.compareAt * l.quantity, cur)}</s>}</div>
              </div>
            ))}
          </>)}
        </div>
        {!empty && (
          <div className="cd-foot">
            <div className="cd-sum">
              <div><span>Subtotal</span><span>{money(subtotal, cur)}</span></div>
              {(cart?.savings ?? 0) > 0 && <div className="save"><span>You save</span><span>−{money(cart!.savings, cur)}</span></div>}
              <div><span>Shipping</span><span>Free · insured</span></div>
              <div><small>Taxes calculated at checkout</small></div>
              <div className="t"><span>Total</span><span>{money(subtotal, cur)}</span></div>
            </div>
            {ringError && <p className="cd-err">{ringError}</p>}
            {needSize ? <button className="cd-co" disabled>Select your ring size to continue</button>
              : rings.length > 0 ? <button className="cd-co" disabled={busy} onClick={checkout}>{busy ? "One moment…" : "Checkout"}</button>
              : <a className="cd-co" href={cart!.checkoutUrl}>Checkout</a>}
            <p className="cd-pay">Secure checkout with Shop Pay, Apple Pay and cards</p>
            <Trust />
          </div>
        )}
      </aside>
    </>
  );
}
