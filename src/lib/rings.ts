// A ring in the bag before checkout: a setting + a diamond + a size. It lives in the browser; Shopify only hears about it at checkout.
import type { Setting, Stone } from "./setting";
export type LocalRing = { id: string; setting: Setting; stone: Stone; size: string };
const KEY = "mk_rings";
export const loadRings = (): LocalRing[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter(r => r && r.setting && r.stone) : []; } catch { return []; } };
const write = (r: LocalRing[]) => { try { localStorage.setItem(KEY, JSON.stringify(r)); window.dispatchEvent(new Event("mk-rings")); } catch { /* ignore */ } };
export const addLocalRing = (setting: Setting, stone: Stone) => {
  const all = loadRings();
  if (all.some(r => r.setting.variantId === setting.variantId && r.stone.stock === stone.stock && r.stone.vendor === stone.vendor)) return;
  write([...all, { id: Math.random().toString(36).slice(2, 10), setting, stone, size: "" }]);
};
export const setLocalRingSize = (id: string, size: string) => write(loadRings().map(r => (r.id === id ? { ...r, size } : r)));
export const removeLocalRing = (id: string) => write(loadRings().filter(r => r.id !== id));
export const clearLocalRings = () => write([]);
