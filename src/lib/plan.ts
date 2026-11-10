/* Meekitaz Daily — the customer's plan (2026-11-09). Once they press "Start at $X a day", the plan (a daily amount and a number of
   months) is kept in the browser and the whole site speaks it: every piece shown per day, "In your plan" or "+$N a day". Nothing here
   touches Shopify prices — it is worked out from the regular price. */
export type Plan = { day: number; months: number; at?: number };
const KEY = "mk_plan";
export const loadPlan = (): Plan | null => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.day > 0 && v.months > 0 ? v : null; } catch { return null; } };
export const savePlan = (p: Plan) => { try { localStorage.setItem(KEY, JSON.stringify({ day: Math.max(1, Math.min(50, Math.round(p.day))), months: Math.max(1, Math.min(4, Math.round(p.months))), at: Date.now() })); window.dispatchEvent(new Event("mk-plan")); } catch { /* ignore */ } };
export const clearPlan = () => { try { localStorage.removeItem(KEY); window.dispatchEvent(new Event("mk-plan")); } catch { /* ignore */ } };
export const planTotal = (p: Plan) => p.day * 30 * p.months;
export const perDay = (price: number, p: Plan) => Math.ceil(price / (30 * p.months));
/** in: fits the plan · near: up to 30% over ("just a little more") · far: further than that */
export const planTier = (price: number, p: Plan): "in" | "near" | "far" => { const t = planTotal(p); return price <= t ? "in" : price <= t * 1.3 ? "near" : "far"; };
export const usdR = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/** "Show what fits first" — one switch for the whole site (on unless they turn it off). */
export const loadFit = () => { try { return localStorage.getItem("mk_plan_fit") !== "0"; } catch { return true; } };
export const saveFit = (on: boolean) => { try { localStorage.setItem("mk_plan_fit", on ? "1" : "0"); window.dispatchEvent(new Event("mk-plan")); } catch { /* ignore */ } };
/** The grid in plan order, by what's left after the bag: what fits, then (after the tile) what's a little more, then the rest. */
export function planOrder<T>(items: T[], price: (x: T) => number, left: number, p: Plan) {
  const room = Math.max(0, left), near = room + 30 * p.months * 3; // "a little more": up to ~$3 a day over what's left
  const a = items.filter(x => price(x) <= room).sort((x, y) => price(y) - price(x));
  const b = items.filter(x => price(x) > room && price(x) <= near).sort((x, y) => price(x) - price(y));
  const c = items.filter(x => price(x) > near).sort((x, y) => price(x) - price(y));
  return { shown: [...a, ...b, ...c], split: b.length + c.length ? a.length : -1 };
}
