"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/shopify";

type Ctx = {
  cart: Cart | null; open: boolean; busy: boolean; configured: boolean;
  setOpen: (v: boolean) => void;
  add: (variantId: string, quantity?: number) => Promise<void>;
  setQty: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
  addRing: (variantId: string, vendor: number, stock: string) => Promise<{ ok: boolean; error?: string }>;
  setRingSize: (lineIds: string[], size: string) => Promise<void>;
  removeRing: (lineIds: string[]) => Promise<void>;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error("useCart outside CartProvider"); return c; };

async function call(body: unknown): Promise<{ cart: Cart | null; error?: string }> {
  try {
    const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { cart: null, error: j.error || "failed" };
    return { cart: j.cart as Cart };
  } catch { return { cart: null, error: "failed" }; }
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
    const r = await call(body);
    if (r.cart) { setCart(r.cart); if (openAfter) setOpen(true); }
    setBusy(false);
    return r;
  }, []);

  const value = useMemo<Ctx>(() => ({
    cart, open, busy, configured, setOpen,
    add: (variantId, quantity = 1) => run({ action: "add", variantId, quantity }, true).then(() => undefined),
    setQty: (lineId, quantity) => run({ action: "update", lineId, quantity }).then(() => undefined),
    remove: lineId => { run({ action: "remove", lineId }); return Promise.resolve(); },
    addRing: async (variantId, vendor, stock) => { const r = await run({ action: "addRing", variantId, vendor, stock }, true); return { ok: !!r.cart, error: r.error }; },
    setRingSize: async (lineIds, size) => { await run({ action: "ringSize", lineIds, size }); },
    removeRing: async lineIds => { await run({ action: "removeRing", lineIds }); },
  }), [cart, open, busy, configured, run]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
