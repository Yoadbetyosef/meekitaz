import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { getCollectionPage, getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { FLOATING_QUERY, gemQuery, oneOfOneQuery, ringQuery, styleQuery } from "@/lib/ringfilters";


const list = (v: string | null) => (v ? v.split(",").map(x => x.trim()).filter(Boolean).slice(0, 12) : []);
const num = (v: string | null) => { const n = Number(v); return v && Number.isFinite(n) ? n : undefined; };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const handle = sp.get("handle") || "";
  const EXTRA = ["one-of-one", "ready-to-ship", "floating"]; // collections with their own pages, newest first
  if (!shopifyConfigured || (!categories.some(c => c.slug === handle) && !EXTRA.includes(handle))) return NextResponse.json({ products: [], hasNext: false, cursor: null });
  const opts = { first: 24, after: sp.get("after"), sort: sp.get("sort") || (EXTRA.includes(handle) ? "new" : "best") };
  const r = handle === "engagement-rings" || handle === "fancy-colors"
    ? await getProductsByQuery(ringQuery({ shapes: list(sp.get("shape")), metals: list(sp.get("metal")), styles: list(sp.get("look")), min: num(sp.get("min")), max: num(sp.get("max")), fancy: handle === "fancy-colors" ? (sp.get("fancy") || "all") : undefined, type: handle === "fancy-colors" ? sp.get("type") || undefined : undefined }), opts)
    : handle === "gemstones" && sp.get("type") ? await getProductsByQuery(gemQuery(sp.get("style") || "", sp.get("type") || ""), opts)
    : handle === "floating" ? await getProductsByQuery(FLOATING_QUERY, opts)
    : EXTRA.includes(handle) && sp.get("style") ? await getProductsByQuery(oneOfOneQuery(handle, sp.get("style") || ""), opts)
    : sp.get("style") ? await getProductsByQuery(styleQuery(handle, sp.get("style") || ""), opts)
    : await getCollectionPage(handle, opts);
  if (!r) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
