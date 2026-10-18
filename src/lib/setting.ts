// The ring setting the customer is building a ring around. Kept in the browser so it follows them to the diamonds.
export type Setting = { ns: string; handle: string; variantId: string; title: string; shape: string; metal: string; price: number; image: string };
const KEY = "mk_setting";
export const loadSetting = (): Setting | null => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.handle ? v : null; } catch { return null; } };
export const saveSetting = (s: Setting) => { try { localStorage.setItem(KEY, JSON.stringify(s)); window.dispatchEvent(new Event("mk-setting")); } catch { /* ignore */ } };
export const clearSetting = () => { try { localStorage.removeItem(KEY); window.dispatchEvent(new Event("mk-setting")); } catch { /* ignore */ } };
/** Where "Choose this setting" leads: the diamonds, already on the stone shape of the setting and from 2 carats up. */
export const diamondsUrl = (shape: string) => `/diamonds?style=${encodeURIComponent(shape)}&c=2-20&build=1`;

/** The diamond the customer picked. */
export type Stone = { vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null; cut: string | null; lab: string; image: string; price: number; fancy: string | null };
const SKEY = "mk_stone";
export const loadStone = (): Stone | null => { try { const v = JSON.parse(localStorage.getItem(SKEY) || "null"); return v && v.stock ? v : null; } catch { return null; } };
export const saveStone = (s: Stone) => { try { localStorage.setItem(SKEY, JSON.stringify(s)); window.dispatchEvent(new Event("mk-stone")); } catch { /* ignore */ } };
export const clearStone = () => { try { localStorage.removeItem(SKEY); window.dispatchEvent(new Event("mk-stone")); } catch { /* ignore */ } };
export const stoneLabel = (s: Stone) => `${s.carat.toFixed(2)} ct ${s.shape}`;
/** "Choose this diamond": with a setting already chosen we go to the review; otherwise the customer picks a setting for this stone's shape. */
export function chooseStone(s: Stone, push: (url: string) => void) {
  saveStone(s);
  push(loadSetting() ? "/build" : `/engagement-rings?style=${encodeURIComponent(s.shape)}&build=1`);
}
