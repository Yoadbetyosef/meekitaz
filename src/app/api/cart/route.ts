import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addToCart, createCart, getCart, removeCartLine, shopifyConfigured, updateCartLine, type Cart } from "@/lib/shopify";

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
    cart = id ? await addToCart(id, body.variantId, qty) : null;
    if (!cart) cart = await createCart(body.variantId, qty); // no cart yet, or the old one expired
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
