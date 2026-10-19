import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import { OLD_HANDLE_TAG, titleSlug } from "@/lib/slug";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// One-time task: give every product a handle that reads like its title (SEO), keeping the old handle as a tag for redirects.
// Open /api/admin/handles?key=ADMIN_TASK_KEY in the browser; the page walks the whole catalogue in batches.
const SKIP = new Set(["diamond", "karat variant", "built ring"]); // products the site creates at checkout; their handles are derived
const BATCH = 40;

type Node = { id: string; handle: string; title: string; tags: string[]; status: string };

export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY;
  const sp = req.nextUrl.searchParams;
  if (!key || sp.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  if (!sp.get("run")) return new NextResponse(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });

  const after = sp.get("after") || null;
  try {
    const d = await adminGraphql<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] } }>(
      `query($first:Int!,$after:String){ products(first:$first, after:$after, sortKey:ID){ pageInfo{ hasNextPage endCursor } nodes{ id handle title tags status } } }`, { first: BATCH, after });
    let renamed = 0, skipped = 0, same = 0; const log: string[] = [];
    for (const p of d.products.nodes) {
      if (p.tags.some(t => SKIP.has(t.toLowerCase())) || p.status === "ARCHIVED") { skipped++; continue; }
      const want = titleSlug(p.title);
      if (!want || want === p.handle) { same++; continue; }
      const handle = await freeHandle(want, p.id);
      const tags = [...p.tags.filter(t => !t.startsWith(OLD_HANDLE_TAG)), `${OLD_HANDLE_TAG}${p.handle}`];
      const u = await adminGraphql<{ productUpdate: { product: { handle: string } | null; userErrors: { message: string }[] } }>(
        `mutation($input: ProductInput!){ productUpdate(input: $input){ product{ handle } userErrors{ field message } } }`, { input: { id: p.id, handle, tags } });
      if (u.productUpdate.userErrors.length) log.push(`${p.handle}: ${u.productUpdate.userErrors.map(e => e.message).join(", ")}`);
      else { renamed++; log.push(`${p.handle} → ${handle}`); }
    }
    return NextResponse.json({ renamed, same, skipped, log, next: d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 502 });
  }
}

// Two products with the same title cannot share a handle: the second becomes title-2, the third title-3.
async function freeHandle(want: string, selfId: string): Promise<string> {
  for (let n = 1; n < 50; n++) {
    const h = n === 1 ? want : `${want}-${n}`;
    const r = await adminGraphql<{ productByHandle: { id: string } | null }>(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h });
    if (!r.productByHandle || r.productByHandle.id === selfId) return h;
  }
  return `${want}-${Date.now()}`;
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>Meekitaz · SEO handles</title>
<style>body{font:15px/1.5 -apple-system,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1c1a1b}pre{background:#f6f3ee;padding:14px;border-radius:10px;max-height:60vh;overflow:auto;font-size:12px}b{font-size:18px}button{font:inherit;padding:10px 18px;border-radius:999px;border:0;background:#7a1a1a;color:#fff;cursor:pointer}</style>
<b>Rename product handles to match titles</b>
<p>Walks every product in the store and sets its link to its title. Diamonds and karat products made at checkout are left alone. Old links keep working.</p>
<button id="go">Start</button> <span id="st"></span><pre id="log"></pre>
<script>
const key=new URLSearchParams(location.search).get('key');let tot={renamed:0,same:0,skipped:0};
document.getElementById('go').onclick=async()=>{document.getElementById('go').disabled=true;let after='';
for(let i=0;i<2000;i++){let j=null;
for(let a=0;a<5&&!j;a++){try{const r=await fetch('/api/admin/handles?run=1&key='+key+(after?'&after='+encodeURIComponent(after):''));const x=await r.json();if(x.error)throw new Error(x.error);j=x}catch(e){st.textContent='retrying batch '+(i+1)+' ('+(a+1)+'/5)… '+e.message;await new Promise(r=>setTimeout(r,3000*(a+1)))}}
if(!j){st.textContent='Stopped after 5 failed tries on batch '+(i+1)+' — refresh and press Start again.';return}
for(const k in tot)tot[k]+=j[k];
st.textContent='batch '+(i+1)+' · renamed '+tot.renamed+' · unchanged '+tot.same+' · skipped '+tot.skipped;if(j.log.length)log.textContent+=j.log.join('\\n')+'\\n';
if(!j.next){st.textContent+=' · DONE';return}after=j.next}};
</script>`;
