"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/shopify";

type Ctx = {
  cart: Cart | null; open: boolean; busy: boolean; configured: boolean;
  setOpen: (v: boolean) => void;
  add: (variantId: string, quantity?: number) => Promise<void>;
  setQty: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error("useCart outside CartProvider"); return c; };

async function call(body: unknown): Promise<Cart | null> {
  try {
    const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return null;
    return (await r.json()).cart as Cart;
  } catch { return null; }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => { setCart(d.cart ?? null); setConfigured(d.configured !== false); }).catch(() => {});
  }, []);

  const run = useCallback(async (body: unknown, openAfter = false) => {
    setBusy(true);
    const next = await call(body);
    if (next) { setCart(next); if (openAfter) setOpen(true); }
    setBusy(false);
  }, []);

  const value = useMemo<Ctx>(() => ({
    cart, open, busy, configured, setOpen,
    add: (variantId, quantity = 1) => run({ action: "add", variantId, quantity }, true),
    setQty: (lineId, quantity) => run({ action: "update", lineId, quantity }),
    remove: lineId => run({ action: "remove", lineId }),
  }), [cart, open, busy, configured, run]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
