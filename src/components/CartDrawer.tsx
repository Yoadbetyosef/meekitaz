"use client";
import SizePicker from "./SizePicker";
import { DailyLine } from "./DailyPrice";
import { useDaily } from "./DailyMode";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartLine } from "@/lib/shopify";
import { clearSetting, clearStone, saveSetting, saveStone } from "@/lib/setting";
import { useCart } from "./CartProvider";
import { arrivalLabel, installments } from "@/lib/arrival";

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
  const { cart, open, busy, setOpen, setQty, remove, rings, ringError, bagCount, setRingSize, removeRing, setCartRingSize, removeCartRing, checkout, addCare, setExpress } = useCart();
  const daily = useDaily();
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
  const express = lines.some(l => l.handle === "express-shipping-3-5-days");
  const plain = lines.filter(l => !inRing.has(l.id) && !(daily && l.handle === "express-shipping-3-5-days")); // in Daily the express line lives in the shipping switch
  const needSize = rings.some(r => !r.size) || cartRings.some(r => !r.size);
  const ringsTotal = rings.reduce((t, r) => t + r.setting.price + r.stone.price, 0);
  const subtotal = (cart?.subtotal ?? 0) + ringsTotal;
  const cur = cart?.currency || "USD";
  const empty = lines.length === 0 && rings.length === 0;
  const leave = (url: string) => { setOpen(false); router.push(url); };
  const sizeBox = (id: string, value: string, onPick: (v: string) => void) => (
    <SizePicker id={id} value={value} disabled={busy} onPick={onPick} />
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
            <div className="cd-empty"><i className="mkm" aria-hidden="true" /><p>Nothing here yet.</p><small>Serious diamonds, worn lightly.</small><Link href="/" onClick={() => setOpen(false)}>Shop the collection</Link></div>
          ) : (<>
            {rings.map(r => (
              <div className="cd-ring cd-one" key={r.id} style={{ opacity: busy ? .6 : 1 }}>
                <div className="cd-li">
                  <Link href={`/products/${r.setting.handle}`} className="cd-im cd-combo" onClick={() => setOpen(false)}>
                    {r.setting.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`${r.setting.image}${r.setting.image.includes("?") ? "&" : "?"}width=240`} alt="" />}
                    {r.stone.image && /* eslint-disable-next-line @next/next/no-img-element */ <img className="cd-stone-badge" src={r.stone.image} alt="" referrerPolicy="no-referrer" />}
                  </Link>
                  <div>
                    <h4>{r.setting.title}</h4>
                    <div className="cd-meta">{[r.setting.karat, r.setting.metal, `${r.stone.carat.toFixed(2)} ct ${r.stone.shape}`, r.stone.fancy || r.stone.color, r.stone.clarity, r.stone.lab].filter(Boolean).join(" · ")}</div>
                    <div className="cd-links">
                      <button className="cd-chg" onClick={() => { removeRing(r.id); saveSetting(r.setting); clearStone(); leave(`/diamonds?style=${encodeURIComponent(r.stone.shape)}&c=2-20&build=1`); }}>Change diamond</button>
                      <button className="cd-chg" onClick={() => { removeRing(r.id); saveStone(r.stone); clearSetting(); leave(`/engagement-rings?style=${encodeURIComponent(r.stone.shape)}&build=1`); }}>Change setting</button>
                    </div>
                  </div>
                  <div className="cd-pr">{money(r.setting.price + r.stone.price, cur)}<button className="cd-rm" onClick={() => { removeRing(r.id); }} disabled={busy}>Remove</button></div>
                </div>
                {sizeBox(r.id, r.size, v => setRingSize(r.id, v))}
              </div>
            ))}
            {cartRings.map(r => (
              <div className="cd-ring cd-one" key={r.build} style={{ opacity: busy ? .6 : 1 }}>
                <div className="cd-li">
                  <Link href={`/products/${r.setting.handle}`} className="cd-im cd-combo" onClick={() => setOpen(false)}>
                    {r.setting.image && <Image src={r.setting.image.url} alt={r.setting.image.alt} fill sizes="92px" />}
                    {r.stone.image && /* eslint-disable-next-line @next/next/no-img-element */ <img className="cd-stone-badge" src={r.stone.image.url} alt="" />}
                  </Link>
                  <div>
                    <h4>{r.setting.title}</h4>
                    <div className="cd-meta">{[attr(r.setting, "Gold"), attr(r.setting, "Diamond")].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="cd-pr">{money(r.setting.price + r.stone.price, cur)}<button className="cd-rm" onClick={() => { removeCartRing([r.setting.id, r.stone.id]); clearSetting(); clearStone(); }} disabled={busy}>Remove</button></div>
                </div>
                {sizeBox(r.build, r.size, v => setCartRingSize([r.setting.id, r.stone.id], v))}
              </div>
            ))}
            {plain.map(l => (
              <div className="cd-li" key={l.id} style={{ opacity: busy ? .6 : 1 }}>
                <Link href={`/products/${l.handle}`} className="cd-im" onClick={() => setOpen(false)}>
                  {l.image && <Image src={l.image.url} alt={l.image.alt} fill sizes="92px" />}
                </Link>
                <div>
                  <h4>{l.title.replace(/ \((?:[^()]*)\)$/, "")}</h4>
                  {l.variantTitle && <div className="cd-meta">{l.variantTitle}</div>}
                  {l.attributes.filter(a => !["Build", "Arrives by"].includes(a.key)).length > 0 && <div className="cd-meta">{l.attributes.filter(a => !["Build", "Arrives by"].includes(a.key)).map(a => a.value.replace(/ Carat$/i, " ct")).join(" · ")}</div>}
                  {l.compareAt > 0 && <span className="cd-tag">50% off · made to order</span>}
                  {!l.handle.startsWith("care-package") && <div className="cd-qty">
                    <button onClick={() => setQty(l.id, l.quantity - 1)} aria-label="Decrease quantity" disabled={busy}>−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => setQty(l.id, l.quantity + 1)} aria-label="Increase quantity" disabled={busy}>+</button>
                  </div>}
                  <button className="cd-rm" onClick={() => remove(l.id)} disabled={busy}>Remove</button>
                </div>
                <div className="cd-pr">{money(l.price * l.quantity, cur)}{l.compareAt > 0 && <s>{money(l.compareAt * l.quantity, cur)}</s>}</div>
              </div>
            ))}
            {(() => {
              const hasCare = plain.some(l => l.handle.startsWith("care-package") && l.handle !== "express-shipping-3-5-days");
              const first = rings[0]?.setting.title || plain.find(l => !l.handle.startsWith("care-package"))?.title;
              if (hasCare || !first) return null;
              return (
                <div className="cd-care">
                  <span>✦ Keep it like new for life: resizing, cleanings, re-plating. <a href="/warranty" target="_blank" rel="noopener">Details</a></span>
                  <div>{daily ? <button disabled={busy} onClick={() => addCare("life425", first)}>Add Lifetime Warranty · $425</button> : <><button disabled={busy} onClick={() => addCare("life", first)}>Add Lifetime · $390</button><button className="alt" disabled={busy} onClick={() => addCare("3y", first)}>3-Year · $250</button></>}</div>
                </div>
              );
            })()}
          </>)}
        {!empty && (
          <div className="cd-foot">
            <div className="cd-sum">
              <div><span>Subtotal</span><span>{money(subtotal, cur)}</span></div>
              {(cart?.savings ?? 0) > 0 && <div className="save"><span>You save</span><span>−{money(cart!.savings, cur)}</span></div>}
              {daily ? <>
                <label className="cd-exp"><input type="checkbox" checked={express} disabled={busy} onChange={e => setExpress(e.target.checked)} /><span><b>Express shipping</b><small>Insured, arrives in 3–5 business days</small></span><em>$150</em></label>
                <div><span>Shipping</span><span>{express ? "Express · $150" : "Free · insured"}</span></div>
                <div className="cd-arr"><span>Arrives</span><span>{express ? "in 3–5 business days" : arrivalLabel()}</span></div>
              </> : <>
              <div><span>Shipping</span><span>Free · insured</span></div>
              <div className="cd-arr"><span>Arrives by</span><span>{arrivalLabel()}</span></div></>}
              <div><small>Taxes calculated at checkout</small></div>
              <div className="t"><span>Total</span><span>{money(subtotal, cur)}</span></div>
              <DailyLine price={subtotal} className="bag" />
            </div>
            {ringError && <p className="cd-err">{ringError}</p>}
            {needSize ? <button className="cd-co" disabled>Select your ring size to continue</button>
              : rings.length > 0 ? <button className="cd-co" disabled={busy} onClick={checkout}>{busy ? "One moment…" : "Checkout"}</button>
              : <a className="cd-co" href={cart!.checkoutUrl}>Checkout</a>}
            {installments(subtotal) && <p className="cd-inst">{installments(subtotal)}</p>}
            <div className="cd-wallets" aria-label="Ways to pay" role="group">
              <small>Pay with</small>
              {/* the wallets themselves run inside Shopify's checkout; each icon takes the customer straight there */}
              <button type="button" className="cd-wgo" disabled={busy || needSize} onClick={() => (rings.length > 0 ? checkout() : (window.location.href = cart!.checkoutUrl))} aria-label="Go to checkout to pay with a wallet"></button>
              <i className="w-apple" title="Apple Pay"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.7c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-3.9zM14 5.6c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"/></svg>Pay</i>
              <i className="w-gpay" title="Google Pay">G Pay</i>
              <i className="w-shop" title="Shop Pay">shop</i>
              <i className="w-pp" title="PayPal">PayPal</i>
              <i className="w-card" title="Cards">Visa · MC · Amex</i>
            </div>
            <Trust />
          </div>
        )}
        </div>
      </aside>
    </>
  );
}
