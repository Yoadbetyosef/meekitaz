import { NextRequest, NextResponse } from "next/server";
import { searchDiamonds, refreshWhiteSnapshot, vdbConfigured, SHAPES } from "@/lib/vdb";

export const maxDuration = 300; // the cron copies ~240 supplier pages; visitors read the saved copy

export async function GET(req: NextRequest) {
  if (!vdbConfigured) return NextResponse.json({ configured: false, total: 0, items: [] });
  const sp = req.nextUrl.searchParams;
  // the cron (every 20 min) or an admin with the key: copy the inventory and save it for everyone
  const cron = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (cron) { const n = await refreshWhiteSnapshot().catch(() => -1); return NextResponse.json({ refreshed: n }); }
  const num = (k: string) => { const v = sp.get(k); const n = v === null || v === "" ? NaN : Number(v); return isFinite(n) ? n : undefined; };
  try {
    const r = await searchDiamonds({
      shapes: (sp.get("shapes") || "").split(",").filter(x => SHAPES.includes(x)),
      caratFrom: num("caratFrom"), caratTo: num("caratTo"), priceFrom: num("priceFrom"), priceTo: num("priceTo"),
      colorFrom: sp.get("colorFrom") || undefined, colorTo: sp.get("colorTo") || undefined,
      clarityFrom: sp.get("clarityFrom") || undefined, clarityTo: sp.get("clarityTo") || undefined,
      sort: sp.get("sort") || undefined, page: num("page"), pageSize: 24,
    });
    return NextResponse.json({ configured: true, ...r }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ configured: true, error: "unavailable", total: 0, items: [] }, { status: 502 });
  }
}
