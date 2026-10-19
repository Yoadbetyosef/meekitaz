// Nested options (Diamond Weight → Diamond Color → Diamond Clarity, Gold Purity, and top-level extras such as Backing Type or Length)
// as Nature Sparkle's theme defines them per product. Prices are add-ons over the product's base price; compare-at add-ons are double.
export type NestedLeaf = { name: string; price: number; compare_at_price?: number; optionData?: NestedGroup[] };
export type NestedGroup = { option_name: string; Options?: NestedLeaf[]; options?: NestedLeaf[] };
export type CustomOption = { name: string; values: { label: string; price: number }[] };
export type ProductOptions = { nested: NestedGroup[]; custom: CustomOption[]; source: string; at: string };
export const OPTIONS_NS = "meekitaz", OPTIONS_KEY = "options";

/** Pull the option tree and the extra options out of a Nature Sparkle product page. */
export function parseNsOptions(html: string, source: string): ProductOptions | null {
  const m = html.match(/<script type="application\/json" data-nested-variant-json>\s*(\{[\s\S]*?\})\s*<\/script>/);
  let nested: NestedGroup[] = [];
  if (m) { try { nested = (JSON.parse(m[1]) as { variant_data?: NestedGroup[] }).variant_data || []; } catch { nested = []; } }
  const custom: CustomOption[] = [];
  for (const f of html.matchAll(/<fieldset[^>]*data-v1-option-fieldset[^>]*data-option-name="([^"]+)"[^>]*>([\s\S]*?)<\/fieldset>/g)) {
    const values = [...f[2].matchAll(/data-option-label="([^"]+)"[^>]*data-price="([^"]*)"/g)].map(v => ({ label: v[1], price: +v[2] || 0 }));
    if (values.length) custom.push({ name: f[1], values });
  }
  if (!nested.length && !custom.length) return null;
  return { nested, custom, source, at: new Date().toISOString() };
}

export type Sel = Record<string, string>; // option name → chosen value
const opts = (g?: NestedGroup) => g?.Options || g?.options || [];
/** The option rows to show, in order, given the current selection: Weight → Color → Clarity (nested), Gold Purity, then extras. */
export function optionRows(o: ProductOptions, sel: Sel): { name: string; values: { label: string; price: number }[] }[] {
  const rows: { name: string; values: { label: string; price: number }[] }[] = [];
  const wg = o.nested.find(g => g.option_name === "Diamond Weight");
  const weights = opts(wg);
  if (weights.length) {
    rows.push({ name: "Diamond Weight", values: weights.map(w => ({ label: w.name, price: w.price || 0 })) });
    const w = weights.find(x => x.name === sel["Diamond Weight"]) || weights[0];
    const cg = (w.optionData || []).find(g => g.option_name === "Diamond Color"), colors = opts(cg);
    if (colors.length) {
      rows.push({ name: "Diamond Color", values: colors.map(c => ({ label: c.name, price: c.price || 0 })) });
      const c = colors.find(x => x.name === sel["Diamond Color"]) || colors[0];
      const kg = (c.optionData || []).find(g => g.option_name === "Diamond Clarity"), clar = opts(kg);
      if (clar.length) rows.push({ name: "Diamond Clarity", values: clar.map(k => ({ label: k.name, price: k.price || 0 })) });
    }
    const gg = (w.optionData || []).find(g => g.option_name === "Gold Purity"), gold = opts(gg);
    if (gold.length) rows.push({ name: "Gold Purity", values: gold.map(g => ({ label: g.name, price: g.price || 0 })) });
  }
  for (const c of o.custom) if (!rows.some(r => r.name === c.name)) rows.push({ name: c.name, values: c.values });
  return rows;
}
/** Fill in defaults (first value of every row) for whatever the selection does not say. */
export function completeSel(o: ProductOptions, sel: Sel): Sel {
  const out: Sel = {};
  for (let i = 0; i < 6; i++) { // rows depend on earlier picks, so settle in a few passes
    const rows = optionRows(o, { ...sel, ...out });
    let changed = false;
    for (const r of rows) {
      const want = sel[r.name] ?? out[r.name];
      // default = the combination the product's base price describes: the cheapest value of each row (first one on a tie)
      const cheapest = r.values.reduce((a, b) => (b.price < a.price ? b : a), r.values[0]).label;
      const v = r.values.some(x => x.label === want) ? want : cheapest;
      if (out[r.name] !== v) { out[r.name] = v; changed = true; }
    }
    if (!changed) break;
  }
  return out;
}
/** Price add-on over the base price for a complete selection (the nested tree prices only at its leaves). */
export function addonFor(o: ProductOptions, sel: Sel): number {
  let sum = 0;
  const rows = optionRows(o, sel);
  for (const r of rows) { const v = r.values.find(x => x.label === sel[r.name]); if (v) sum += v.price; }
  return sum;
}
/** Short label for the bag and the product title: "1 ct · E-F · VVS-VS · 14K · Screw back". */
export const selLabel = (sel: Sel) => Object.entries(sel).map(([k, v]) => (k === "Diamond Weight" ? v.replace(/ Carat$/i, " ct") : v)).join(" · ");
