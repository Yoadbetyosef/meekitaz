import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { getCollectionPage, getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";

const list = (v: string | null) => (v ? v.split(",").map(x => x.trim()).filter(Boolean).slice(0, 12) : []);
const num = (v: string | null) => { const n = Number(v); return v && Number.isFinite(n) ? n : undefined; };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const handle = sp.get("handle") || "";
  if (!shopifyConfigured || !categories.some(c => c.slug === handle)) return NextResponse.json({ products: [], hasNext: false, cursor: null });
  const opts = { first: 24, after: sp.get("after"), sort: sp.get("sort") || "best" };
  const r = handle === "engagement-rings"
    ? await getProductsByQuery(ringQuery({ shapes: list(sp.get("shape")), metals: list(sp.get("metal")), styles: list(sp.get("look")), min: num(sp.get("min")), max: num(sp.get("max")) }), opts)
    : await getCollectionPage(handle, opts);
  if (!r) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
