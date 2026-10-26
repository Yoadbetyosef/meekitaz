import { NextRequest, NextResponse } from "next/server";
import { getRingFamily, shopifyConfigured, getProductByHandle, designCode } from "@/lib/shopify";

// The same ring design in another shape (same metal when it exists). Used by the diamond page when the customer changes the stone shape.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams, ns = sp.get("ns") || "", shape = (sp.get("shape") || "") === "Elongated Cushion" ? "Cushion" : sp.get("shape") || "", metal = sp.get("metal") || "", color = sp.get("color") || "";
  // ?handle=… : one setting by its product handle (used by shared "design" links)
  const h = sp.get("handle");
  if (h && shopifyConfigured) {
    const p = await getProductByHandle(h); const code = p ? designCode(p.tags) : "";
    if (!code) return NextResponse.json({ item: null });
    const fam = await getRingFamily(code); const item = fam.find(v => v.handle === h) || null;
    return NextResponse.json({ item, ns: code }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  }
  if (!shopifyConfigured || !/^NS-\d+$/.test(ns)) return NextResponse.json({ item: null });
  const fam = await getRingFamily(ns, ["Yellow", "Pink", "Blue", "Green"].includes(color) ? color : "");
  const item = fam.find(v => v.shape === shape && v.metal === metal) || fam.find(v => v.shape === shape) || null;
  return NextResponse.json({ item, shapeAvailable: fam.some(v => v.shape === shape) }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
