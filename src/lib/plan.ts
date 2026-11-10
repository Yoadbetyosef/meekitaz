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
