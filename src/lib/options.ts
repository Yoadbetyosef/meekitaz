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
