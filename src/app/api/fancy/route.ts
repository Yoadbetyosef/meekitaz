import { NextRequest, NextResponse } from "next/server";
import { searchFancy, vdbConfigured, SHAPES, FANCY_COLORS } from "@/lib/vdb";

export const maxDuration = 120; // the first request after a cold start reads ~90 result pages

export async function GET(req: NextRequest) {
  if (!vdbConfigured) return NextResponse.json({ configured: false, total: 0, items: [], facets: [] });
  const sp = req.nextUrl.searchParams;
  const num = (k: string) => { const v = sp.get(k); const n = v === null || v === "" ? NaN : Number(v); return isFinite(n) ? n : undefined; };
  const color = sp.get("color") || undefined;
  try {
    const r = await searchFancy({
      color: color && FANCY_COLORS.includes(color) ? color : undefined,
      intFrom: num("intFrom"), intTo: num("intTo"), caratFrom: num("caratFrom"), caratTo: num("caratTo"), priceFrom: num("priceFrom"), priceTo: num("priceTo"),
      shapes: (sp.get("shapes") || "").split(",").filter(x => SHAPES.includes(x)), sort: sp.get("sort") || undefined, page: num("page"),
    });
    return NextResponse.json({ configured: true, ...r }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ configured: true, error: "unavailable", total: 0, items: [], facets: [] }, { status: 502 });
  }
}
