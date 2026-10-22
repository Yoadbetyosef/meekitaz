import type { CategoryPage } from "@/lib/data";
import type { Product } from "@/lib/shopify";
import { getCollectionPage, getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { fillPage } from "@/lib/designs";
import { gemQuery, styleQuery } from "@/lib/ringfilters";
import ProductBrowser from "./ProductBrowser";

const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;

export default async function ProductGrid({ page, style = "", type = "" }: { page: CategoryPage; style?: string; type?: string }) {
  // One fetch returns ~96 products, but the metal versions of a design fold into one card, so a single fetch can open the page with only a few cards.
  // Keep fetching until a full page of designs is on screen (the same rule "Show more" uses), up to a few fetches.
  const query = type ? (o: { first: number; after: string | null }) => getProductsByQuery(gemQuery(style, type), o)
    : style ? (o: { first: number; after: string | null }) => getProductsByQuery(styleQuery(page.slug, style), o)
    : (o: { first: number; after: string | null }) => getCollectionPage(page.slug, o);
  let r: { products: Product[]; hasNext: boolean; cursor: string | null } | null = null;
  if (shopifyConfigured) {
    const f = await fillPage([], { cursor: null, hasNext: true }, after => query({ first: 24, after }), 24, 5);
    r = f.failed && !f.items.length ? null : { products: f.items, hasNext: f.hasNext, cursor: f.cursor };
  }
  if (r && (r.products.length > 0 || style || type)) return <ProductBrowser key={`${style}|${type}`} handle={page.slug} style={style} type={type} initial={r.products} hasNext={r.hasNext} cursor={r.cursor} />;
  return (
    <section className="grid-wrap" aria-label="The collection">
      <div className="wrap">
        <h2>The collection</h2>
        <div className="pgrid">
          {page.items.map(it => (
            <div key={it.name} className="pcard">
              <div className="pcard-img"><Gem /></div>
              <div className="pcard-txt"><b>{it.name}</b><p>{it.meta}</p><span className="soon">Coming soon</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
