import { arrivalLabel } from "@/lib/arrival";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addCartLines, addToCart, createCart, createCartWithLines, getCart, removeCartLine, removeCartLines, shopifyConfigured, updateCartLine, updateLineAttributes, type Cart } from "@/lib/shopify";
import { getDiamond, vdbConfigured } from "@/lib/vdb";
import { adminConfigured, ensureKaratVariant, ensureStoneVariant } from "@/lib/shopifyAdmin";

const SIZES = new Set(Array.from({ length: 21 }, (_, i) => String(3 + i * 0.5)));

const COOKIE = "meekitaz_cart";
const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function GET() {
  if (!shopifyConfigured) return NextResponse.json({ cart: null, configured: false });
  const id = (await cookies()).get(COOKIE)?.value;
  const cart = id ? await getCart(id) : null; // expired/checked-out carts come back null
  return NextResponse.json({ cart, configured: true });
}

export async function POST(req: Request) {
  if (!shopifyConfigured) return NextResponse.json({ error: "Shopify is not configured" }, { status: 503 });
  const jar = await cookies();
  const body = await req.json().catch(() => ({}));
  const id = jar.get(COOKIE)?.value;
  let cart: Cart | null = null;

  if (body.action === "add" && typeof body.variantId === "string") {
    const qty = Math.max(1, Math.min(10, +body.quantity || 1));
    let variantId: string = body.variantId;
    if (body.karat === "14K" || body.karat === "18K") { // the 14K and 18K versions of a design are created in Shopify the first time they are bought
      if (!adminConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503 });
      try { variantId = await ensureKaratVariant(variantId, body.karat); } catch (e) { console.error("[karat]", e instanceof Error ? e.message : e); return NextResponse.json({ error: "failed" }, { status: 502 }); }
    }
    cart = id ? await addToCart(id, variantId, qty) : null;
    if (!cart) cart = await createCart(variantId, qty); // no cart yet, or the old one expired
  } else if (body.action === "ringsCheckout" && Array.isArray(body.rings) && body.rings.length > 0 && body.rings.length <= 5) {
    // rings waiting in the bag become real cart lines now: the setting, and a Shopify product for the chosen diamond
    if (!adminConfigured || !vdbConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    try {
      const lines: { merchandiseId: string; quantity: number; attributes: { key: string; value: string }[] }[] = [];
      for (const r of body.rings as { variantId?: string; vendor?: number; stock?: string; size?: string; karat?: string }[]) {
        const vendor = Number(r.vendor), stock = String(r.stock || ""), variantId = String(r.variantId || ""), size = String(r.size || "");
        if (!isFinite(vendor) || !stock || !SIZES.has(size) || !variantId.startsWith("gid://shopify/ProductVariant/")) return NextResponse.json({ error: "bad_request" }, { status: 400 });
        const d = await getDiamond(vendor, stock); // the price always comes from our supplier feed
        if (!d) return NextResponse.json({ error: "gone", stock }, { status: 410 });
        const title = `${d.carat.toFixed(2)} ct ${d.shape} lab-grown diamond`;
        const note = [title, [d.fancy || d.color, d.clarity, d.cut && `${d.cut} cut`].filter(Boolean).join(" "), `${d.lab} ${d.cert}`].filter(Boolean).join(" · ");
        const html = `<ul><li>${title}</li><li>Colour: ${d.fancy || d.color || "—"}</li><li>Clarity: ${d.clarity || "—"}</li><li>Cut: ${d.cut || "—"}</li><li>Certificate: ${d.lab} ${d.cert}</li></ul>`;
        const stoneVariant = await ensureStoneVariant({ vendor: d.vendor, stock: d.stock, title: `${title} (${d.lab} ${d.cert})`, price: d.price, html, sku: `${d.lab}-${d.cert}`, image: d.image });
        const karat = ["", "10K", "14K", "18K"].includes(String(r.karat || "")) ? String(r.karat || "") : "";
        const settingVariant = await ensureKaratVariant(variantId, karat);
        const build = crypto.randomUUID().slice(0, 8);
        const arrives = { key: "Arrives by", value: arrivalLabel() };
        lines.push({ merchandiseId: settingVariant, quantity: 1, attributes: [{ key: "Build", value: build }, { key: "Diamond", value: note }, { key: "Ring size", value: size }, ...(karat ? [{ key: "Gold", value: karat }] : []), arrives] });
        lines.push({ merchandiseId: stoneVariant, quantity: 1, attributes: [{ key: "Build", value: build }, { key: "Ring size", value: size }, arrives] });
      }
      cart = id ? await addCartLines(id, lines) : null;
      if (!cart) cart = await createCartWithLines(lines);
    } catch (e) { const m = e instanceof Error ? e.message : String(e); console.error("[ringsCheckout]", m); return NextResponse.json({ error: "failed", detail: m.slice(0, 200) }, { status: 502 }); }
  } else if (id && body.action === "ringSize" && Array.isArray(body.lineIds) && SIZES.has(String(body.size))) {
    const cur = await getCart(id); if (!cur) return NextResponse.json({ error: "Cart update failed" }, { status: 502 });
    const ids = new Set((body.lineIds as unknown[]).map(String));
    const updates = cur.lines.filter(l => ids.has(l.id)).map(l => ({ id: l.id, quantity: l.quantity, attributes: [...l.attributes.filter(a => a.key !== "Ring size"), { key: "Ring size", value: String(body.size) }] }));
    cart = updates.length ? await updateLineAttributes(id, updates) : cur;
  } else if (id && body.action === "removeRing" && Array.isArray(body.lineIds)) {
    cart = await removeCartLines(id, (body.lineIds as unknown[]).map(String));
  } else if (id && body.action === "update" && typeof body.lineId === "string") {
    cart = await updateCartLine(id, body.lineId, Math.max(0, Math.min(10, +body.quantity || 0)));
  } else if (id && body.action === "remove" && typeof body.lineId === "string") {
    cart = await removeCartLine(id, body.lineId);
  } else {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!cart) return NextResponse.json({ error: "Cart update failed" }, { status: 502 });
  jar.set(COOKIE, cart.id, opts);
  return NextResponse.json({ cart });
}
