import { NextRequest } from "next/server";
import { vdbRaw } from "@/lib/vdb";
// (temporary, 2026-11-12) which certificate fields does the supplier send for one stone? Keys only, no secrets.
export async function GET(req: NextRequest) {
  const stock = req.nextUrl.searchParams.get("s") || "";
  const b = await vdbRaw(`type=Lab_grown_Diamond&markup_mode=true&stock_num=${encodeURIComponent(stock)}`);
  const d = (b?.diamonds || [])[0] || {};
  const pick = Object.fromEntries(Object.entries(d).filter(([k]) => /cert|pdf|file|lab|report|url/i.test(k)));
  const m = String((d as Record<string, unknown>).masked_cert_url || "");
  let probe = "";
  if (m) { try { const r = await fetch(m, { redirect: "follow" }); probe = `${r.status} ${r.url} ${r.headers.get("content-type")} ${r.headers.get("x-frame-options") || ""} ${r.headers.get("content-security-policy") || ""} ${(r.headers.get("content-type") || "").includes("pdf") ? "PDF" : (await r.text()).slice(0, 300)}`; } catch (e) { probe = String(e); } }
  return Response.json({ ...pick, probe });
}
