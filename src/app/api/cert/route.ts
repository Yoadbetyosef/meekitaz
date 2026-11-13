import { NextRequest } from "next/server";

/* (2026-11-12) The diamond's certificate, shown inside the site: the grading labs don't always let their PDF be framed by another
   site, so it is passed through here and served inline. Only the labs' own hosts are allowed. */
const OK = [/(^|\.)igi\.org$/i, /(^|\.)gia\.edu$/i, /^s3\.amazonaws\.com$/i, /\.amazonaws\.com$/i, /(^|\.)hrdantwerp\.com$/i, /(^|\.)gcal\.com$/i, /\.cloudfront\.net$/i];
export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "";
  let url: URL;
  try { url = new URL(u); } catch { return new Response("Bad link", { status: 400 }); }
  if (url.protocol !== "https:" || !OK.some(r => r.test(url.hostname))) return new Response("Not a lab link", { status: 400 });
  try {
    // IGI answers browsers only: ask like one (a real browser's headers, IGI's own site as the referrer)
    const H = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept": "application/pdf,text/html;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9", "Referer": "https://www.igi.org/" };
    let r = await fetch(url.toString(), { redirect: "follow", headers: H, next: { revalidate: 86400 } });
    if (req.nextUrl.searchParams.get("debug")) return new Response(`${r.status} ${r.url} ${r.headers.get("content-type")} ${(await r.text()).slice(0, 400)}`, { headers: { "Content-Type": "text/plain" } });
    // IGI's report number also lives on its public PDF host; try it if the viewer link refuses
    if (!r.ok && /igi\.org$/i.test(url.hostname)) { const rep = url.searchParams.get("r"); if (rep) r = await fetch(`https://www.igi.org/viewpdf.php?r=${encodeURIComponent(rep)}`, { redirect: "follow", headers: H, next: { revalidate: 86400 } }); }
    if (!r.ok || !r.body) return new Response("Certificate unavailable", { status: 502 });
    const type = r.headers.get("content-type") || "application/pdf";
    return new Response(r.body, { headers: { "Content-Type": /pdf|octet/i.test(type) ? "application/pdf" : type, "Content-Disposition": "inline; filename=\"certificate.pdf\"", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  } catch { return new Response("Certificate unavailable", { status: 502 }); }
}
