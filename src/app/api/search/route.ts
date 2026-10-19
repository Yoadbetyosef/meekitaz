import { NextRequest, NextResponse } from "next/server";
import { searchProducts, shopifyConfigured } from "@/lib/shopify";
import { parseIntent } from "@/lib/search";

// As-you-type search for the palette: one card per design (the metals of a design are collapsed), cached at the edge for 5 minutes.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 60);
  if (!shopifyConfigured || q.length < 2) return NextResponse.json({ designs: [] });
  const { terms, max } = parseIntent(q);
  const r = await searchProducts(terms || (max ? "diamond" : q), { first: 60, maxPrice: max });
  if (!r) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  if (!r.length) console.log("[search:no-results]", q); // visible in the Vercel logs: what people look for and do not find
  const designs = r.slice(0, 8).map(p => ({
    handle: p.handle, title: p.title, price: p.price, currency: p.currency, image: p.image,
    metals: (p.variants || []).map(v => v.metal).filter(Boolean),
  }));
  return NextResponse.json({ designs }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
