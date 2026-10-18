"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";

const money = (n: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

const Trust = () => (
  <div className="trust">
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>Free insured shipping</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" /></svg>30-day free returns</div>
    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>Lifetime warranty</div>
  </div>
);

export default function CartDrawer() {
  const { cart, open, busy, setOpen, setQty, remove } = useCart();
  const lines = cart?.lines ?? [];
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
          ) : lines.map(l => (
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
            <a className="cd-co" href={cart.checkoutUrl}>Checkout</a>
            <p className="cd-pay">Secure checkout with Shop Pay, Apple Pay and cards</p>
            <Trust />
          </div>
        )}
      </aside>
    </>
  );
}
