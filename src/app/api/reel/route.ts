import { NextRequest, NextResponse } from "next/server";
import { getReel } from "@/lib/shopify";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const r = await getReel(Math.min(+(sp.get("first") || 24), 48), sp.get("after"), sp.get("type") || "", sp.get("sort") || "new").catch(() => ({ items: [], hasNext: false, cursor: null }));
  return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
}
