import { searchProducts, type Product } from "./shopify";
import { cleanQuery, correctTerms, parseIntent, type Go } from "./search";

/** The whole search: read the intent, look products up, and if nothing is found retry once with typos corrected. Server only. */
export async function runSearch(raw: string, first = 60): Promise<{ designs: Product[] | null; corrected?: string; go: Go[]; max?: number }> {
  const { go, terms, max } = parseIntent(raw);
  const base = terms || (max ? "diamond" : cleanQuery(raw));
  if (!base) return { designs: [], go, max };
  let designs = await searchProducts(base, { first, maxPrice: max });
  let corrected: string | undefined;
  if (designs && designs.length === 0) {
    const fixed = correctTerms(base);
    if (fixed !== base) { const again = await searchProducts(fixed, { first, maxPrice: max }); if (again && again.length) { designs = again; corrected = fixed; } }
  }
  return { designs, corrected, go, max };
}
