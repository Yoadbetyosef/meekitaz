import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts, shopifyConfigured } from "@/lib/shopify";
import { POPULAR, parseIntent } from "@/lib/search";
import DesignCard from "@/components/DesignCard";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 60);
  const maxParam = typeof sp.max === "string" ? Number(sp.max) : undefined;
  const intent = q ? parseIntent(q) : null;
  const max = maxParam && Number.isFinite(maxParam) ? maxParam : intent?.max;
  const found = q && shopifyConfigured ? await searchProducts(intent?.terms || (max ? "diamond" : q), { first: 120, maxPrice: max }) : null;
  const list = found || [];
  return (
    <main>
      <section className="sec srch" aria-label="Search results">
        <div className="wrap">
          <small className="eyebrow">Search</small>
          <h1 className="h2">{q ? <>Results for &ldquo;{q}&rdquo;</> : "What are you looking for?"}</h1>
          <form action="/search" method="get" className="srch-form">
            <input name="q" defaultValue={q} placeholder="Search diamonds, rings, earrings…" autoComplete="off" aria-label="Search" />
            <button type="submit">Search</button>
          </form>
          {intent && intent.go.length > 0 && (
            <div className="srch-go">{intent.go.map(g => <Link key={g.href} href={g.href} className="srch-gopill"><b>{g.label}</b><small>{g.hint}</small></Link>)}</div>
          )}
          {q && <p className="srch-n">{list.length ? `${list.length} design${list.length === 1 ? "" : "s"}${max ? ` under $${max.toLocaleString("en-US")}` : ""}` : ""}</p>}
          {list.length > 0 ? (
            <div className="pgrid">{list.map(p => <DesignCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="srch-empty">
              <p>{q ? `Nothing matched “${q}”. Try fewer words, a shape (oval, cushion), or a category.` : "Try one of these."}</p>
              <div className="srch-chips">{POPULAR.map(p => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="sp-chip">{p}</Link>)}</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
