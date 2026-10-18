import { NextRequest, NextResponse } from "next/server";
import { vdbRaw, getFancy } from "@/lib/vdb";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
// Diagnostic: which VDB parameters return fancy-colour lab-grown stones directly. Open /api/admin/vdb?key=ADMIN_TASK_KEY
const BASE = "type=Lab_grown_Diamond&markup_mode=true&with_images=true&total_or_price_per_carat=total_sales_price&price_total_from=1&page_size=50&page_number=1";
const PROBES: [string, string][] = [
  ["type=Fancy_Color_Diamond", BASE.replace("type=Lab_grown_Diamond", "type=Fancy_Color_Diamond")],
  ["type=Lab_grown_Fancy_Color_Diamond", BASE.replace("type=Lab_grown_Diamond", "type=Lab_grown_Fancy_Color_Diamond")],
  ["type=Fancy_Diamond", BASE.replace("type=Lab_grown_Diamond", "type=Fancy_Diamond")],
  ["type=Colored_Diamond", BASE.replace("type=Lab_grown_Diamond", "type=Colored_Diamond")],
  ["type=Lab_grown_Colored_Diamond", BASE.replace("type=Lab_grown_Diamond", "type=Lab_grown_Colored_Diamond")],
  ["types[]=Lab_grown_Diamond&fancy_colors[]=Yellow", BASE.replace("type=Lab_grown_Diamond", "types[]=Lab_grown_Diamond") + "&fancy_colors[]=Yellow"],
  ["search=fancy", `${BASE}&search=fancy`],
  ["q=fancy yellow", `${BASE}&q=fancy%20yellow`],
  ["keyword=fancy", `${BASE}&keyword=fancy`],
  ["color_from=Fancy Yellow (full name)", `${BASE}&color_from=Fancy%20Yellow&color_to=Fancy%20Yellow`],
  ["colors[]=Fancy Vivid Yellow", `${BASE}&colors[]=Fancy%20Vivid%20Yellow`],
  ["LAST PAGE raw record (what a fancy stone looks like)", `${BASE.replace("page_number=1", "page_number=2053")}&preference[]=color%20ASC`],
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
  await Promise.all(PROBES.map(async ([name, qs]) => {
    const t = Date.now();
    try {
      const b = await vdbRaw(qs);
      const fancy = b.diamonds.filter(d => d.fancy_color_dominant_color || d.fancy_color_intensity);
      const raw = fancy[0] || b.diamonds[0];
      out[name] = { total: b.total_diamonds_found, onPage: b.diamonds.length, fancyOnPage: fancy.length, ms: Date.now() - t,
        sample: fancy.slice(0, 3).map(d => `${d.shape} ${d.size}ct ${d.fancy_color_intensity || ""} ${d.fancy_color_dominant_color || ""} color=${d.color}`),
        ...(name.startsWith("LAST PAGE") && raw ? { raw: Object.fromEntries(Object.entries(raw).filter(([k]) => !/url|image|video/i.test(k))) } : {}) };
    } catch (e) { out[name] = { error: e instanceof Error ? e.message : String(e), ms: Date.now() - t }; }
  }));
  return NextResponse.json(out);
}
