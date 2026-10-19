import type { CategoryPage } from "@/lib/data";
import { getCollectionPage, getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { styleQuery } from "@/lib/ringfilters";
import ProductBrowser from "./ProductBrowser";

const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;

export default async function ProductGrid({ page, style = "" }: { page: CategoryPage; style?: string }) {
  const r = shopifyConfigured ? (style ? await getProductsByQuery(styleQuery(page.slug, style), { first: 24 }) : await getCollectionPage(page.slug, { first: 24 })) : null;
  if (r && (r.products.length > 0 || style)) return <ProductBrowser key={style} handle={page.slug} style={style} initial={r.products} hasNext={r.hasNext} cursor={r.cursor} />;
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
