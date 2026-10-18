import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { getCollectionPage, shopifyConfigured } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const handle = sp.get("handle") || "";
  if (!shopifyConfigured || !categories.some(c => c.slug === handle)) return NextResponse.json({ products: [], hasNext: false, cursor: null });
  const r = await getCollectionPage(handle, { first: 24, after: sp.get("after"), sort: sp.get("sort") || "best" });
  if (!r) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
