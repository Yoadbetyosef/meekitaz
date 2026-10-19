import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
// Diagnostic: everything the import put on one product (options, variants with prices, metafields, tags).
// /api/admin/product?key=ADMIN_TASK_KEY&handle=<product handle>   (or &q=<title words> to find handles)
export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY, sp = req.nextUrl.searchParams;
  if (!key || sp.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  try {
    if (sp.get("q")) {
      const r = await adminGraphql<{ products: { nodes: { handle: string; title: string; productType: string }[] } }>(`query($q:String!){ products(first:20, query:$q){ nodes{ handle title productType } } }`, { q: `title:${sp.get("q")}` });
      return NextResponse.json(r.products.nodes);
    }
    const r = await adminGraphql<{ productByHandle: unknown }>(`query($h:String!){ productByHandle(handle:$h){
      id title handle productType vendor tags
      options{ name values }
      variants(first:100){ nodes{ id title price compareAtPrice sku selectedOptions{ name value } } }
      metafields(first:100){ nodes{ namespace key type value } }
    } }`, { h: sp.get("handle") || "" });
    return NextResponse.json(r.productByHandle ?? { error: "no product with that handle" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 }); }
}
