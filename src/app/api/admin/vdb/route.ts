import { NextRequest, NextResponse } from "next/server";
import { vdbRaw, getFancy } from "@/lib/vdb";

export const maxDuration = 120;
export const dynamic = "force-dynamic";
// Diagnostic: which VDB parameters return fancy-colour lab-grown stones directly. Open /api/admin/vdb?key=ADMIN_TASK_KEY
const BASE = "type=Lab_grown_Diamond&markup_mode=true&with_images=true&total_or_price_per_carat=total_sales_price&price_total_from=1&page_size=50&page_number=1";
const PROBES: [string, string][] = [
  ["fancy_color_dominant_colors[]=Yellow", `${BASE}&fancy_color_dominant_colors[]=Yellow`],
  ["fancy_color_intensities[]=Fancy", `${BASE}&fancy_color_intensities[]=Fancy`],
  ["fancy_color_intensity[]=Fancy", `${BASE}&fancy_color_intensity[]=Fancy`],
  ["fancy_color_overtones[]=none", `${BASE}&fancy_color_overtones[]=none`],
  ["colors[]=Fancy", `${BASE}&colors[]=Fancy`],
  ["color[]=Fancy", `${BASE}&color[]=Fancy`],
  ["color_from=Fancy&color_to=Fancy", `${BASE}&color_from=Fancy&color_to=Fancy`],
  ["color_type=fancy", `${BASE}&color_type=fancy`],
  ["fancy_colored=true", `${BASE}&fancy_colored=true`],
  ["is_fancy_color=true", `${BASE}&is_fancy_color=true`],
  ["fancy_color=true", `${BASE}&fancy_color=true`],
  ["has_fancy_color=true", `${BASE}&has_fancy_color=true`],
  ["natural_fancy=true", `${BASE}&natural_fancy=true`],
  ["page_size=200 (bigger pages?)", `${BASE.replace("page_size=50", "page_size=200")}&preference[]=color%20ASC`],
];
export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY;
  if (!key || req.nextUrl.searchParams.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  const out: Record<string, unknown> = {};
  if (req.nextUrl.searchParams.get("harvest")) { // time the real harvest: /api/admin/vdb?key=…&harvest=1
    const t = Date.now();
    try { const items = await getFancy(); return NextResponse.json({ fancyStones: items.length, ms: Date.now() - t, byColor: items.reduce<Record<string, number>>((a, d) => { a[d.fancyColor || "?"] = (a[d.fancyColor || "?"] || 0) + 1; return a; }, {}) }); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e), ms: Date.now() - t }, { status: 502 }); }
  }
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
