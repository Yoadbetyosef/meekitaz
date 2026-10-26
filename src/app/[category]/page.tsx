import RingSteps from "@/components/RingSteps";
import Image, { getImageProps } from "next/image";
import HeroVideo from "@/components/HeroVideo";
import { DailyHeroBadge } from "@/components/DailyPrice";
import { notFound } from "next/navigation";
import { categories } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";
import { Suspense } from "react";
import ShapeRow from "@/components/ShapeRow";
import StoneBrowser from "@/components/StoneBrowser";
import FancyColorRow from "@/components/FancyColorRow";
import { fancySwatches, vdbConfigured } from "@/lib/vdb";
import RingsSection from "@/components/RingsSection";
import SettingBar from "@/components/SettingBar";
import JumpToResults from "@/components/JumpToResults";
import StoneBar from "@/components/StoneBar";
import GemTypeBar from "@/components/GemTypeBar";
import { GEM_TYPES, gemQuery } from "@/lib/ringfilters";
import { getProductsByQuery, shopifyConfigured } from "@/lib/shopify";

export function generateStaticParams() { return categories.map(c => ({ category: c.slug })); }
// Always rendered fresh: the page reads its filters from the address bar, and a cached copy from an older build must never be served.
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; const p = categories.find(c => c.slug === category);
  return { title: p ? `${p.nav} — MEEKITAZ` : "MEEKITAZ" };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category } = await params;
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return typeof v === "string" ? v : ""; };
  const p = categories.find(c => c.slug === category);
  if (!p) notFound();
  const n = p.styles.length;
  // Gemstones: which jewelry types exist for the chosen stone (a type with nothing in it is not offered), so the page never leads to an empty list.
  const gemTypes = p.slug === "gemstones" && shopifyConfigured
    ? (await Promise.all(GEM_TYPES.map(async t => { const r = await getProductsByQuery(gemQuery(one("style"), t.label), { first: 1 }).catch(() => null); return r && r.products.length ? t.label : ""; }))).filter(Boolean)
    : [];
  const gemType = gemTypes.includes(one("type")) ? one("type") : "";
  const heroMobile = getImageProps({ src: p.mobile, alt: "", fill: true, sizes: "100vw", quality: 78 }).props;
  return (
    <main>
      <section className="cat-hero" aria-label={p.nav}>
        <picture>
          <source media="(max-width:767px)" srcSet={heroMobile.srcSet} sizes="100vw" />
          <Image src={p.desktop} alt="" fill loading="eager" fetchPriority="high" sizes="100vw" quality={78} style={{ "--hero-pos": p.heroPos || "50% 50%", "--hero-zoom": p.heroZoom || 1 } as React.CSSProperties} />
        </picture>
        {(p.videoDesktop || p.videoMobile) && <HeroVideo desktop={p.videoDesktop} mobile={p.videoMobile} />}
        <div className="wrap"><h1><small>{p.small}</small>{p.title}</h1><DailyHeroBadge /></div>
      </section>
      <div className={`catbody${p.slug === "diamonds" ? " dm-page" : ""}`}>
        {p.slug === "diamonds" && <RingSteps step={2} />}
        {p.slug === "diamonds" && <Suspense fallback={null}><SettingBar /></Suspense>}
        {p.slug === "engagement-rings" && <Suspense fallback={null}><StoneBar /></Suspense>}
        <JumpToResults />
        {n > 0 && p.styleHead && (
          <section className="shapes" aria-label={p.styleHead[0]}>
            <div className="wrap">
              <div className="sp-head"><small className="eyebrow">{p.styleHead[0]}</small><h2>{p.styleHead[1]}</h2></div>
              <Suspense fallback={null}><ShapeRow styles={p.styles} className={`sp-row${n === 6 ? " n6" : n === 4 ? " n4" : n > 7 ? " scroll" : ""}`} /></Suspense>
            </div>
          </section>
        )}
        {p.special === "fancy" ? <><FancyColorRow color={one("color")} /><Suspense fallback={null}><RingsSection fancy={one("color") || "all"} /></Suspense></> : p.special === "rings" ? <Suspense fallback={null}><RingsSection /></Suspense> : p.filters ? <Suspense fallback={null}><StoneBrowser swatches={vdbConfigured ? await fancySwatches() : {}} /></Suspense> : <><Suspense fallback={null}>{gemTypes.length > 1 && <section className="gem-types" aria-label="Jewelry type"><div className="wrap"><small className="eyebrow">Jewelry type</small><GemTypeBar types={gemTypes} /></div></section>}</Suspense><ProductGrid page={p} style={one("style")} type={gemType} /></>}
      </div>
    </main>
  );
}
