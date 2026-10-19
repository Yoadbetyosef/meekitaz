"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/shopify";
import type { Setting, Stone } from "@/lib/setting";
import { addLocalRing, clearLocalRings, loadRings, removeLocalRing, setLocalRingSize, type LocalRing } from "@/lib/rings";
import { clearSetting, clearStone } from "@/lib/setting";

type Ctx = {
  cart: Cart | null; open: boolean; busy: boolean; configured: boolean;
  rings: LocalRing[]; ringError: string; bagCount: number;
  setOpen: (v: boolean) => void;
  add: (variantId: string, quantity?: number, karat?: string) => Promise<{ ok: boolean; error?: string }>;
  addConfigured: (variantId: string, handle: string, sel: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  setQty: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
  /** A ring (setting + diamond) goes into the bag. It stays in the browser until checkout. */
  addRing: (setting: Setting, stone: Stone) => void;
  setRingSize: (id: string, size: string) => void;
  removeRing: (id: string) => void;
  /** Rings already inside the Shopify cart (after a checkout attempt that was abandoned). */
  setCartRingSize: (lineIds: string[], size: string) => Promise<void>;
  removeCartRing: (lineIds: string[]) => Promise<void>;
  /** Sends the rings in the bag to Shopify and goes to checkout. */
  checkout: () => Promise<void>;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error("useCart outside CartProvider"); return c; };

async function call(body: unknown): Promise<{ cart: Cart | null; error?: string; detail?: string }> {
  try {
    const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { cart: null, error: j.error || "failed", detail: j.detail };
    return { cart: j.cart as Cart };
  } catch { return { cart: null, error: "failed" }; }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [rings, setRings] = useState<LocalRing[]>([]);
  const [ringError, setRingError] = useState("");

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => { setCart(d.cart ?? null); setConfigured(d.configured !== false); }).catch(() => {});
  }, []);
  useEffect(() => { const sync = () => setRings(loadRings()); sync(); window.addEventListener("mk-rings", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("mk-rings", sync); window.removeEventListener("storage", sync); }; }, []);

  const run = useCallback(async (body: unknown, openAfter = false) => {
    setBusy(true);
    const r = await call(body);
    if (r.cart) { setCart(r.cart); if (openAfter) setOpen(true); }
    setBusy(false);
    return r;
  }, []);

  const checkout = useCallback(async () => {
    const list = loadRings();
    if (!list.length || list.some(r => !r.size)) return;
    setRingError(""); setBusy(true);
    const r = await call({ action: "ringsCheckout", rings: list.map(x => ({ variantId: x.setting.variantId, vendor: x.stone.vendor, stock: x.stone.stock, size: x.size, karat: x.setting.karat || "" })) });
    if (r.cart) { clearLocalRings(); setCart(r.cart); window.location.href = r.cart.checkoutUrl; return; }
    setBusy(false);
    setRingError(r.error === "not_configured" ? "Checkout for custom rings is being connected. Please book an appointment and we will complete your order with you."
      : r.error === "gone" ? "One of the diamonds is no longer available. Please choose another." : `We could not start your checkout. Please try again, or book an appointment.${r.detail ? ` (${r.detail})` : ""}`);
  }, []);

  const value = useMemo<Ctx>(() => ({
    cart, open, busy, configured, rings, ringError, setOpen,
    bagCount: (() => {
      const builds = new Set<string>(); let plain = 0;
      (cart?.lines ?? []).forEach(l => { const b = l.attributes?.find(a => a.key === "Build")?.value; if (b) builds.add(b); else plain += l.quantity; });
      return plain + builds.size + rings.length;
    })(),
    add: async (variantId, quantity = 1, karat) => { const r = await run({ action: "add", variantId, quantity, karat: karat || "" }, true); return { ok: !!r.cart, error: r.error }; },
    addConfigured: async (variantId, handle, sel) => { const r = await run({ action: "configure", variantId, handle, sel }, true); return { ok: !!r.cart, error: r.error }; },
    setQty: (lineId, quantity) => run({ action: "update", lineId, quantity }).then(() => undefined),
    remove: lineId => { run({ action: "remove", lineId }); return Promise.resolve(); },
    // the ring is in the bag: the "setting in progress" and "stone in progress" are done, so the next diamond starts a fresh build
    addRing: (setting, stone) => { setRingError(""); addLocalRing(setting, stone); clearSetting(); clearStone(); setOpen(true); },
    setRingSize: (id, size) => { setRingError(""); setLocalRingSize(id, size); },
    removeRing: id => { removeLocalRing(id); },
    setCartRingSize: async (lineIds, size) => { await run({ action: "ringSize", lineIds, size }); },
    removeCartRing: async lineIds => { await run({ action: "removeRing", lineIds }); },
    checkout,
  }), [cart, open, busy, configured, rings, ringError, run, checkout]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
