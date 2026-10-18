import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";
import DiamondFilters from "@/components/DiamondFilters";

export function generateStaticParams() { return categories.map(c => ({ category: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; const p = categories.find(c => c.slug === category);
  return { title: p ? `${p.nav} — MEEKITAZ` : "MEEKITAZ" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const p = categories.find(c => c.slug === category);
  if (!p) notFound();
  const n = p.styles.length;
  return (
    <main>
      <section className="cat-hero" aria-label={p.nav}>
        <picture>
          <source media="(max-width:767px)" srcSet={p.mobile} />
          <Image src={p.desktop} alt="" fill priority sizes="100vw" quality={78} />
        </picture>
        <div className="wrap"><h1><small>{p.small}</small>{p.title}</h1></div>
      </section>
      <div className="catbody">
        {n > 0 && p.styleHead && (
          <section className="shapes" aria-label={p.styleHead[0]}>
            <div className="wrap">
              <div className="sp-head"><small className="eyebrow">{p.styleHead[0]}</small><h2>{p.styleHead[1]}</h2></div>
              <div className={`sp-row${n === 6 ? " n6" : n === 4 ? " n4" : ""}`}>
                {p.styles.map(s => (
                  <Link key={s.label} href={`/${p.slug}?style=${encodeURIComponent(s.label)}`} className="sp">
                    <span className="sp-img"><Image src={s.img} alt={s.label} fill sizes="160px" quality={70} /></span><b>{s.label}</b>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        {p.filters && <DiamondFilters />}
        <ProductGrid page={p} />
      </div>
    </main>
  );
}
