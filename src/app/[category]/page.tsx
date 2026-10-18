import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";
import { Suspense } from "react";
import DiamondsBrowser from "@/components/DiamondsBrowser";
import ShapeRow from "@/components/ShapeRow";
import FancyBrowser from "@/components/FancyBrowser";
import RingsSection from "@/components/RingsSection";
import SettingBar from "@/components/SettingBar";
import JumpToResults from "@/components/JumpToResults";
import StoneBar from "@/components/StoneBar";

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
          <Image src={p.desktop} alt="" fill priority sizes="100vw" quality={78} style={{ "--hero-pos": p.heroPos || "50% 50%", "--hero-zoom": p.heroZoom || 1 } as React.CSSProperties} />
        </picture>
        <div className="wrap"><h1><small>{p.small}</small>{p.title}</h1></div>
      </section>
      <div className="catbody">
        {p.slug === "diamonds" && <Suspense fallback={null}><SettingBar /></Suspense>}
        {p.slug === "engagement-rings" && <Suspense fallback={null}><StoneBar /></Suspense>}
        <JumpToResults />
        {n > 0 && p.styleHead && (
          <section className="shapes" aria-label={p.styleHead[0]}>
            <div className="wrap">
              <div className="sp-head"><small className="eyebrow">{p.styleHead[0]}</small><h2>{p.styleHead[1]}</h2></div>
              {p.filters || p.special === "rings" ? <Suspense fallback={null}><ShapeRow styles={p.styles} className={`sp-row${n > 7 ? " scroll" : ""}`} /></Suspense> : (
              <div className={`sp-row${n === 6 ? " n6" : n === 4 ? " n4" : n > 7 ? " scroll" : ""}`}>
                {p.styles.map(s => (
                  <Link key={s.label} href={`/${p.slug}?style=${encodeURIComponent(s.label)}`} className="sp">
                    <span className="sp-img"><Image src={s.img} alt={s.label} fill sizes="160px" quality={70} /></span><b>{s.label}</b>
                  </Link>
                ))}
              </div>)}
            </div>
          </section>
        )}
        {p.special === "fancy" ? <Suspense fallback={null}><FancyBrowser /></Suspense> : p.special === "rings" ? <Suspense fallback={null}><RingsSection /></Suspense> : p.filters ? <Suspense fallback={null}><DiamondsBrowser /></Suspense> : <ProductGrid page={p} />}
      </div>
    </main>
  );
}
