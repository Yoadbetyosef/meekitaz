"use client";
/* The Dream list (wishlist), kept in this browser. A shared copy lives on the server (/api/wish) so friends can vote. */
export type WishItem = { handle: string; title: string; image: string; price: number; compareAt?: number | null };
const K = "mk_wish", KID = "mk_wish_id", KNAME = "mk_wish_name";
const read = (): WishItem[] => { try { return JSON.parse(localStorage.getItem(K) || "[]"); } catch { return []; } };
const write = (l: WishItem[]) => { try { localStorage.setItem(K, JSON.stringify(l)); } catch { /* */ } window.dispatchEvent(new Event("mk-wish")); syncShared(l); };
export const wishList = read;
export const isWished = (handle: string) => read().some(x => x.handle === handle);
export function toggleWish(it: WishItem): boolean {
  const l = read(); const i = l.findIndex(x => x.handle === it.handle);
  if (i >= 0) { l.splice(i, 1); write(l); return false; }
  write([it, ...l].slice(0, 60)); return true;
}
export const removeWish = (handle: string) => write(read().filter(x => x.handle !== handle));
export const sharedId = () => { try { return localStorage.getItem(KID); } catch { return null; } };
export const wishName = () => { try { return localStorage.getItem(KNAME) || ""; } catch { return ""; } };
/** Creates (or updates) the shared copy and returns its id. */
export async function shareList(name?: string): Promise<string | null> {
  if (name !== undefined) try { localStorage.setItem(KNAME, name); } catch { /* */ }
  const r = await fetch("/api/wish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sharedId(), name: name ?? wishName(), items: read() }) }).then(x => x.json()).catch(() => null);
  if (r?.id) { try { localStorage.setItem(KID, r.id); } catch { /* */ } return r.id; }
  return null;
}
let t = 0;
function syncShared(l: WishItem[]) { if (!sharedId()) return; window.clearTimeout(t); t = window.setTimeout(() => { fetch("/api/wish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sharedId(), name: wishName(), items: l }) }).catch(() => {}); }, 800); }
/** Opens the share sheet for one piece / the Dream list drawer, from anywhere. */
export const openShare = (it: WishItem) => window.dispatchEvent(new CustomEvent("mk-share", { detail: it }));
export const openDreamList = () => window.dispatchEvent(new Event("mk-dream-open"));
