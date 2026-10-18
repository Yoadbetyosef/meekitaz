import { NextRequest, NextResponse } from "next/server";
import { getDiamond, vdbConfigured } from "@/lib/vdb";
import { adminConfigured, createRingCart, ensureStoneVariant } from "@/lib/shopifyAdmin";

const SIZES = new Set(Array.from({ length: 21 }, (_, i) => String(3 + i * 0.5)));

export async function POST(req: NextRequest) {
  if (!adminConfigured || !vdbConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  let b: { variantId?: string; vendor?: number; stock?: string; size?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const vendor = Number(b.vendor), stock = String(b.stock || ""), size = String(b.size || ""), variantId = String(b.variantId || "");
  if (!isFinite(vendor) || !stock || !SIZES.has(size) || !variantId.startsWith("gid://shopify/ProductVariant/")) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    const d = await getDiamond(vendor, stock); // the price always comes from our supplier feed, never from the browser
    if (!d) return NextResponse.json({ error: "gone" }, { status: 410 });
    const title = `${d.carat.toFixed(2)} ct ${d.shape} lab-grown diamond`;
    const note = [title, [d.fancy || d.color, d.clarity, d.cut && `${d.cut} cut`].filter(Boolean).join(" "), `${d.lab} ${d.cert}`].filter(Boolean).join(" · ");
    const html = `<ul><li>${title}</li><li>Colour: ${d.fancy || d.color || "—"}</li><li>Clarity: ${d.clarity || "—"}</li><li>Cut: ${d.cut || "—"}</li><li>Certificate: ${d.lab} ${d.cert}</li></ul>`;
    const stoneVariant = await ensureStoneVariant({ vendor: d.vendor, stock: d.stock, title: `${title} (${d.lab} ${d.cert})`, price: d.price, html, sku: `${d.lab}-${d.cert}` });
    const url = await createRingCart(variantId, stoneVariant, size, note);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[build]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
