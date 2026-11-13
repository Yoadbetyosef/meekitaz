import { NextRequest } from "next/server";
import { vdbRaw } from "@/lib/vdb";
// (temporary, 2026-11-12) which certificate fields does the supplier send for one stone? Keys only, no secrets.
export async function GET(req: NextRequest) {
  const stock = req.nextUrl.searchParams.get("s") || "";
  const b = await vdbRaw(`type=Lab_grown_Diamond&markup_mode=true&stock_num=${encodeURIComponent(stock)}`);
  const d = (b?.diamonds || [])[0] || {};
  const pick = Object.fromEntries(Object.entries(d).filter(([k]) => /cert|pdf|file|lab|report|url/i.test(k)));
  return Response.json(pick);
}
