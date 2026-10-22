import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import { OPTIONS_KEY, OPTIONS_NS, parseNsOptions } from "@/lib/options";
import { OLD_HANDLE_TAG } from "@/lib/slug";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
// One-time task (re-runnable): for every non-ring piece, read its option tree and prices from the matching Nature Sparkle page and
// keep it on the product as a metafield. Open /api/admin/options?key=ADMIN_TASK_KEY; the page walks the catalogue in batches.
const TYPES = ["Earrings", "Necklaces", "Bracelets", "Pendants", "Necklace", "Bracelet", "Earring", "Pendant"];
const BATCH = 5;
type Node = { id: string; handle: string; title: string; productType: string; tags: string[]; metafield: { value: string } | null };

export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY, sp = req.nextUrl.searchParams;
  if (!key || sp.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  if (!sp.get("run")) return new NextResponse(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  const after = sp.get("after") || null, force = !!sp.get("force");
  try {
    const q = TYPES.map(t => `product_type:'${t}'`).join(" OR ");
    const d = await adminGraphql<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } }>(
      `query($first:Int!,$after:String,$q:String!){ products(first:$first, after:$after, query:$q, sortKey:ID){ pageInfo{ hasNextPage endCursor } nodes{ id handle title productType tags metafield(namespace:"${OPTIONS_NS}", key:"${OPTIONS_KEY}"){ value } } } }`, { first: BATCH, after, q });
    let saved = 0, skipped = 0, missing = 0; const log: string[] = [];
    for (const p of d.products.nodes) {
      if (p.metafield && !force) { skipped++; continue; }
      if (p.tags.some(t => ["Diamond", "Karat variant"].includes(t))) { skipped++; continue; }
      // the Nature Sparkle page is usually at the handle we imported under (kept as a tag); for products renamed twice the
      // current handle is the original one, so both are tried. A page only counts if it carries the piece's own NS code, so two
      // designs that share a title ("White gold Round Diamond Solitaire Stud Earrings" exists as a 4-prong and a bezel design,
      // and the second one is renamed "...-2") can never take each other's option prices.
      const code = p.tags.find(t => /^NS-\d+$/.test(t)) || "";
      const old = p.tags.find(t => t.startsWith(OLD_HANDLE_TAG))?.slice(OLD_HANDLE_TAG.length);
      const candidates = [...new Set([old, p.handle].filter((x): x is string => !!x))];
      // Nature Sparkle rate-limits bursts (429): one request at a time, a short pause between them, and a patient retry
      const page = async (u: string): Promise<string | null> => {
        let r: Response | null = null;
        for (let a = 0; a < 4; a++) {
          r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Meekitaz catalogue sync)" }, cache: "no-store" });
          if (r.status !== 429 && r.status !== 503) break;
          await new Promise(res => setTimeout(res, 2500 * (a + 1)));
        }
        await new Promise(res => setTimeout(res, 700));
        if (!r?.ok) return null;
        const h = await r.text();
        return !code || h.includes(code) ? h : null;
      };
      let html: string | null = null, url = "";
      for (const h of candidates) { url = `https://naturesparkle.com/products/${h}`; html = await page(url); if (html) break; }
      if (!html) {
        // no page at the handles we know (typical for the "-2" copies of a shared title): look the piece up by its title and keep the page with its NS code
        try {
          const sr = await fetch(`https://naturesparkle.com/search/suggest.json?q=${encodeURIComponent(p.title)}&resources[type]=product&resources[limit]=10`, { headers: { "User-Agent": "Mozilla/5.0 (Meekitaz catalogue sync)" }, cache: "no-store" });
          const hits = ((await sr.json()) as { resources?: { results?: { products?: { handle: string }[] } } })?.resources?.results?.products || [];
          for (const x of hits.map(h => h.handle).filter(h => !candidates.includes(h)).slice(0, 5)) { url = `https://naturesparkle.com/products/${x}`; html = await page(url); if (html) break; }
        } catch { /* fall through to "missing" */ }
      }
      if (!html) { missing++; log.push(`${p.handle}: no Nature Sparkle page carrying ${code || "its code"}`); continue; }
      const opts = parseNsOptions(html, url);
      if (!opts) { missing++; log.push(`${p.handle}: no options on the Nature Sparkle page`); continue; }
      const m = await adminGraphql<{ metafieldsSet: { userErrors: { message: string }[] } }>(
        `mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message } } }`,
        { m: [{ ownerId: p.id, namespace: OPTIONS_NS, key: OPTIONS_KEY, type: "json", value: JSON.stringify(opts) }] });
      if (m.metafieldsSet.userErrors.length) log.push(`${p.handle}: ${m.metafieldsSet.userErrors.map(e => e.message).join(", ")}`);
      else { saved++; const w = opts.nested.find(g => g.option_name === "Diamond Weight"); log.push(`${p.handle}: ${(w?.options || w?.Options || []).length} weights, ${opts.custom.map(c => c.name).join("/") || "no extras"}`); }
    }
    return NextResponse.json({ saved, skipped, missing, log, next: d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 502 }); }
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>Meekitaz · option prices</title>
<style>body{font:15px/1.5 -apple-system,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1c1a1b}pre{background:#f6f3ee;padding:14px;border-radius:10px;max-height:60vh;overflow:auto;font-size:12px}b{font-size:18px}button{font:inherit;padding:10px 18px;border-radius:999px;border:0;background:#7a1a1a;color:#fff;cursor:pointer}</style>
<b>Copy option prices from Nature Sparkle</b>
<p>For every earring, necklace, bracelet and pendant: reads the Diamond Weight / Color / Clarity / Gold Purity price tree (and extras like Backing Type or Length) from the matching Nature Sparkle page and stores it on the product. Products already done are skipped.</p>
<button id="go">Start</button> <span id="st"></span><pre id="log"></pre>
<script>
const key=new URLSearchParams(location.search).get('key');let tot={saved:0,skipped:0,missing:0};
document.getElementById('go').onclick=async()=>{document.getElementById('go').disabled=true;let after='';
for(let i=0;i<5000;i++){let j=null;
for(let a=0;a<5&&!j;a++){try{const r=await fetch('/api/admin/options?run=1&key='+key+(after?'&after='+encodeURIComponent(after):''));const x=await r.json();if(x.error)throw new Error(x.error);j=x}catch(e){st.textContent='retrying batch '+(i+1)+' ('+(a+1)+'/5)… '+e.message;await new Promise(r=>setTimeout(r,3000*(a+1)))}}
if(!j){st.textContent='Stopped on batch '+(i+1)+' — refresh and press Start again.';return}
for(const k in tot)tot[k]+=j[k];
st.textContent='batch '+(i+1)+' · saved '+tot.saved+' · already done '+tot.skipped+' · missing '+tot.missing;if(j.log.length)log.textContent+=j.log.join('\\n')+'\\n';
if(!j.next){st.textContent+=' · DONE';return}after=j.next}};
</script>`;
