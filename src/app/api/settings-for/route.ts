import { NextRequest, NextResponse } from "next/server";
import { getProductsByQuery, getRingFamily } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";
import { karatStep, isGoldMetal } from "@/lib/karat";

// Settings made for one diamond shape in one metal (for "Swap setting" on the build page). Prices include the chosen karat.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shape = sp.get("shape") || "Round", metal = sp.get("metal") || "", karat = sp.get("karat") || "";
  const base = shape === "Elongated Cushion" ? "Cushion" : shape;
  try {
    const r = await getProductsByQuery(ringQuery({ shapes: [base], metals: metal ? [metal] : [], styles: [] }), { first: 40 });
    const seen = new Set<string>(), out: unknown[] = [];
    for (const p of r?.products || []) {
      if (!p.code || seen.has(p.code)) continue; seen.add(p.code);
      const fam = await getRingFamily(p.code);
      const v = fam.find(x => x.shape === base && (!metal || x.metal === metal)); if (!v) continue;
      const k = karat && isGoldMetal(v.metal) ? karat : "";
      out.push({ ns: p.code, handle: v.handle, variantId: v.variantId, title: v.title, shape: v.shape, metal: v.metal, price: v.price + (k ? karatStep(p.code, k) : 0), image: v.images[0] || "", images: v.images.slice(0, 8), karat: k || undefined });
      if (out.length >= 16) break;
    }
    return NextResponse.json({ items: out }, { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=3600" } });
  } catch { return NextResponse.json({ items: [] }); }
}
