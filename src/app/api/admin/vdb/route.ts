import { NextRequest, NextResponse } from "next/server";
import { vdbRaw } from "@/lib/vdb";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
// Diagnostic: which VDB parameters return fancy-colour lab-grown stones directly. Open /api/admin/vdb?key=ADMIN_TASK_KEY
const BASE = "type=Lab_grown_Diamond&markup_mode=true&with_images=true&total_or_price_per_carat=total_sales_price&price_total_from=1&page_size=50&page_number=1";
const PROBES: [string, string][] = [
  ["colour DESC order (fast path)", `${BASE}&preference[]=color%20DESC`],
  ["colour ASC order (tail)", `${BASE}&preference[]=color%20ASC`],
  ["fancy_colors[]=Yellow", `${BASE}&fancy_colors[]=Yellow`],
  ["fancy_color[]=Yellow", `${BASE}&fancy_color[]=Yellow`],
  ["fancy_color_dominant_color[]=Yellow", `${BASE}&fancy_color_dominant_color[]=Yellow`],
  ["colors[]=Fancy Yellow", `${BASE}&colors[]=Fancy%20Yellow`],
  ["color_from=Fancy", `${BASE}&color_from=Fancy`],
  ["fancy=true", `${BASE}&fancy=true`],
  ["is_fancy=true", `${BASE}&is_fancy=true`],
  ["fancy_colors=true", `${BASE}&fancy_colors=true`],
];
export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY;
  if (!key || req.nextUrl.searchParams.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  const out: Record<string, unknown> = {};
  for (const [name, qs] of PROBES) {
    const t = Date.now();
    try {
      const b = await vdbRaw(qs);
      const fancy = b.diamonds.filter(d => d.fancy_color_dominant_color || d.fancy_color_intensity);
      out[name] = { total: b.total_diamonds_found, onPage: b.diamonds.length, fancyOnPage: fancy.length, ms: Date.now() - t,
        sample: fancy.slice(0, 3).map(d => `${d.shape} ${d.size}ct ${d.fancy_color_intensity || ""} ${d.fancy_color_dominant_color || ""}`) };
    } catch (e) { out[name] = { error: e instanceof Error ? e.message : String(e), ms: Date.now() - t }; }
  }
  return NextResponse.json(out);
}
