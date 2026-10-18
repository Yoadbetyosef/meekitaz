import Image from "next/image";
import Link from "next/link";
import type { CategoryPage } from "@/lib/data";
import { getCollectionProducts, shopifyConfigured } from "@/lib/shopify";

const Gem = () => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 8h24l8 12-20 22L4 20z" /><path d="M4 20h40M12 8l12 34M36 8L24 42M18 20l6-12 6 12" /></svg>;

export default async function ProductGrid({ page }: { page: CategoryPage }) {
  const products = shopifyConfigured ? await getCollectionProducts(page.slug) : null;
  return (
    <section className="grid-wrap" aria-label="The collection">
      <div className="wrap">
        <h2>The collection</h2>
        <div className="pgrid">
          {products && products.length > 0 ? products.map(p => (
            <Link key={p.id} href={`/products/${p.handle}`} className="pcard">
              <div className="pcard-img">{p.image ? <Image src={p.image.url} alt={p.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" /> : <Gem />}</div>
              <div className="pcard-txt"><b>{p.title}</b><span className="price">{new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(+p.price)}</span></div>
            </Link>
          )) : page.items.map(it => (
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
