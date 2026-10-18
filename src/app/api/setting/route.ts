import { NextRequest, NextResponse } from "next/server";
import { getRingFamily, shopifyConfigured } from "@/lib/shopify";

// The same ring design in another shape (same metal when it exists). Used by the diamond page when the customer changes the stone shape.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams, ns = sp.get("ns") || "", shape = sp.get("shape") || "", metal = sp.get("metal") || "", color = sp.get("color") || "";
  if (!shopifyConfigured || !/^NS-\d+$/.test(ns)) return NextResponse.json({ item: null });
  const fam = await getRingFamily(ns, ["Yellow", "Pink", "Blue", "Green"].includes(color) ? color : "");
  const item = fam.find(v => v.shape === shape && v.metal === metal) || null;
  return NextResponse.json({ item, shapeAvailable: fam.some(v => v.shape === shape) }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
