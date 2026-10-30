import Link from "next/link";
import RtsGrid from "@/components/RtsGrid";
import { getReel } from "@/lib/shopify";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ready to Ship — MEEKITAZ", description: "One of each. Every piece filmed, ready to ship." };

const KINDS = [["Ring", "Rings"], ["Earrings", "Earrings"], ["Necklace", "Necklaces"], ["Bracelet", "Bracelets"], ["Band", "Bands"]] as const;

/* Ready to Ship · the full-screen fashion hero of every category page, the jewelry circles, then the design-C grid. */
export default async function ReadyToShipPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: string }> }) {
  const { type = "", sort = "new" } = await searchParams;
  const [r, ...pics] = await Promise.all([
    getReel(24, null, type, sort).catch(() => ({ items: [], hasNext: false, cursor: null })),
    ...KINDS.map(([t]) => getReel(1, null, t).then(x => x.items[0]?.image || null).catch(() => null)),
  ]);
  return (
    <main>
      <section className="cat-hero" aria-label="Ready to Ship">
        <picture><source media="(max-width:767px)" srcSet="/media/rts/hero-portrait.jpg" /><img src="/media/rts/hero-wide.jpg" alt="" fetchPriority="high" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "70% 30%" }} /></picture>
        <div className="wrap"><h1>Ready to Ship.</h1></div>
      </section>
      <div className="catbody">
        <section className="shapes" aria-label="Jewelry type"><div className="wrap"><div className="ooo-circles rts-circles"><div className="sp-row">
          {KINDS.map(([t, label], i) => pics[i] && (
            <Link key={t} href={type === t ? "/ready-to-ship#results" : `/ready-to-ship?type=${t}#results`} scroll={false} className={`sp${type === t ? " on" : ""}`} aria-current={type === t ? "page" : undefined}>
              <span className="sp-img"><img src={pics[i] as string} alt="" loading="lazy" /></span><b>{label}</b>
            </Link>
          ))}
        </div></div></div></section>
        <RtsGrid key={type + sort} initial={r.items} hasNext={r.hasNext} cursor={r.cursor} type={type} sort={sort} />
      </div>
    </main>
  );
}
