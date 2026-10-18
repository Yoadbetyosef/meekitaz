import { NextRequest, NextResponse } from "next/server";
import { getProductsByQuery } from "@/lib/shopify";
import { FANCY_QUERY, fancyColorOf } from "@/lib/fancy";

export const dynamic = "force-dynamic";
// Diagnostic: what the catalogue search returns for coloured-diamond pieces. Open /api/admin/fancy?key=ADMIN_TASK_KEY
export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY;
  if (!key || req.nextUrl.searchParams.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  const probes = [FANCY_QUERY, "title:fancy", "title:canary", "title:'pink diamond'", "title:'blue diamond'", "title:'green diamond'", "title:'yellow diamond'", "tag:fancy", "tag:'fancy color'", "tag:canary"];
  const out: Record<string, unknown> = {};
  for (const q of probes) {
    const r = await getProductsByQuery(q, { first: 24 });
    out[q] = r ? { count: r.products.length, hasNext: r.hasNext, titles: r.products.slice(0, 12).map(p => `${p.title}  →  ${fancyColorOf(p.title) || "(no colour read)"}`) } : "error";
  }
  return NextResponse.json(out, { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
