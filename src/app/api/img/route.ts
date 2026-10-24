import { NextRequest, NextResponse } from "next/server";
import { cleanImage } from "@/lib/engrave";

export const maxDuration = 30; // cleaning a photo takes a few seconds the first time; the result is then cached for a year

// Serves a Shopify product photo, with the supplier's engraving painted out when the photo has one.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "";
  const w = Math.min(1600, Math.max(200, Number(req.nextUrl.searchParams.get("w")) || 1000));
  let url: URL;
  try { url = new URL(u); } catch { return new NextResponse("bad url", { status: 400 }); }
  if (url.hostname !== "cdn.shopify.com" || !url.pathname.startsWith("/s/files/")) return new NextResponse("not allowed", { status: 400 });
  const src = `${url.origin}${url.pathname}?width=${w}`;
  try {
    const r = await fetch(src, { headers: { Accept: "image/webp,image/jpeg" }, next: { revalidate: 86400 } });
    if (!r.ok) return NextResponse.redirect(src, 302);
    const buf = Buffer.from(await r.arrayBuffer());
    const slot = Math.max(0, Math.min(9, Number(req.nextUrl.searchParams.get("s")) || 0));
    const cleaned = await cleanImage(buf, slot).catch(() => null);
    const headers = { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" };
    if (cleaned) return new NextResponse(new Uint8Array(cleaned), { headers: { ...headers, "Content-Type": "image/jpeg" } });
    return new NextResponse(new Uint8Array(buf), { headers: { ...headers, "Content-Type": r.headers.get("content-type") || "image/webp" } });
  } catch { return NextResponse.redirect(src, 302); }
}
