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
/** "Choose this diamond": with a setting chosen, the ring (that setting in the diamond's shape + this diamond) goes into the bag; otherwise the customer picks a setting for this stone. */
export async function chooseStone(s: Stone, deps: { push: (url: string) => void; addRing: (setting: Setting, stone: Stone) => void; notify: (msg: string) => void }) {
  saveStone(s);
  let setting = loadSetting();
  if (!setting) { deps.push(`/engagement-rings?style=${encodeURIComponent(s.shape)}&build=1`); return; }
  if (setting.shape !== s.shape) { // the setting follows the shape of the diamond
    let item = null;
    try { item = (await (await fetch(`/api/setting?${new URLSearchParams({ ns: setting.ns, shape: s.shape, metal: setting.metal })}`)).json()).item; } catch { /* handled below */ }
    if (!item) { deps.notify(`That setting is not made in ${s.shape.toLowerCase()}. Choose a setting for your ${s.shape.toLowerCase()} diamond.`); deps.push(`/engagement-rings?style=${encodeURIComponent(s.shape)}&build=1`); return; }
    setting = { ns: setting.ns, handle: item.handle, variantId: item.variantId, title: item.title, shape: item.shape, metal: item.metal, price: item.price, image: item.images[0] || "" };
    saveSetting(setting);
  }
  deps.addRing(setting, s);
}
