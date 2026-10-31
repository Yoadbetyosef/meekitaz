import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* One of One · duplicates: a piece imported twice (the import looked it up by handle while the SEO pass was renaming handles).
   The supplier SKU tag (CGD-…) is the identity: when two products carry the same one, the oldest stays and the newer is deleted. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const seen = new Map<string, string>(), extra: string[] = []; let after: string | null = null;
  for (let i = 0; i < 20; i++) {
    const d = await adminGraphql<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: { id: string; tags: string[] }[] } }>(
      `query($a:String){ products(first:250, after:$a, query:"tag:'One of One'", sortKey:ID){ pageInfo{ hasNextPage endCursor } nodes{ id tags } } }`, { a: after });
    for (const n of d?.products.nodes || []) { const sku = n.tags.find(t => t.startsWith("CGD-")); if (!sku) continue; if (seen.has(sku)) extra.push(n.id); else seen.set(sku, n.id); }
    if (!d?.products.pageInfo.hasNextPage) break; after = d.products.pageInfo.endCursor;
  }
  for (let i = 0; i < extra.length; i += 20) await adminGraphql(`mutation{ ${extra.slice(i, i + 20).map((id, k) => `d${k}: productDelete(input:{ id:"${id}" }){ deletedProductId }`).join(" ")} }`, {});
  console.log(`[one-of-one dedupe] ${seen.size} pieces, ${extra.length} duplicates deleted`);
  return NextResponse.json({ pieces: seen.size, deleted: extra.length });
}
