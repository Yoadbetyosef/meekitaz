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
    // IGI sits behind a browser check (Cloudflare) that a server can't pass. Many IGI reports are also published as a plain PDF on the
    // suppliers' S3 copy — use that when it exists; otherwise send the browser straight to IGI (it passes the check itself).
    const H = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept": "application/pdf,*/*;q=0.8" };
    let target = url.toString();
    if (/igi\.org$/i.test(url.hostname)) {
      const rep = url.searchParams.get("r");
      if (rep) {
        const copy = `https://s3.amazonaws.com/illuminex-media/uploads/diamond/igi_cert/${encodeURIComponent(rep)}.pdf`;
        const h = await fetch(copy, { method: "HEAD", next: { revalidate: 86400 } }).catch(() => null);
        if (h && h.ok) target = copy; else return Response.redirect(url.toString(), 302);
      } else return Response.redirect(url.toString(), 302);
    }
    const r = await fetch(target, { redirect: "follow", headers: H, next: { revalidate: 86400 } });
    if (!r.ok || !r.body) return Response.redirect(url.toString(), 302);
    const type = r.headers.get("content-type") || "application/pdf";
    return new Response(r.body, { headers: { "Content-Type": /pdf|octet/i.test(type) ? "application/pdf" : type, "Content-Disposition": "inline; filename=\"certificate.pdf\"", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  } catch { return new Response("Certificate unavailable", { status: 502 }); }
}
