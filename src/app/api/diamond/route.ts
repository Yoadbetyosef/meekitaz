import { NextRequest, NextResponse } from "next/server";
import { getDiamond, vdbConfigured } from "@/lib/vdb";

// Fresh data for one diamond (the review page checks the price before it lets anyone check out).
export async function GET(req: NextRequest) {
  const vendor = Number(req.nextUrl.searchParams.get("vendor")), stock = req.nextUrl.searchParams.get("stock") || "";
  if (!vdbConfigured || !isFinite(vendor) || !stock) return NextResponse.json({ item: null });
  try {
    const d = await getDiamond(vendor, stock);
    return NextResponse.json({ item: d ? { vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, lab: d.lab, image: d.image, price: d.price, fancy: d.fancy } : null });
  } catch { return NextResponse.json({ item: null, error: "unavailable" }, { status: 502 }); }
}
