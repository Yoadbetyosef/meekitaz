import Link from "next/link";
import { getOneOfOne, getCollectionProducts } from "@/lib/shopify";
import { photoSrc } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/* Home · under the gemstones slide: the one-of-ones. One stone, one setting, one ring; tag a product "One of One" in Shopify and it appears
   here, and when it sells it stays, stamped Claimed. The photo's own blue is the section's background, so she sits in it edge to edge. */
export default async function OneOfOne() {
  let items = await getOneOfOne(8).catch(() => []);
  let preview = false;
  if (!items.length) { // nothing tagged "One of One" yet: show the newest engagement rings as a stand-in, marked Preview (no 1-of-1 claim)
    const fb = (await getCollectionProducts("engagement-rings", 4).catch(() => null)) || [];
    items = fb.map(p => ({ handle: p.handle, title: p.title.replace(/^(Yellow|White|Rose) gold /i, "").replace(/ Engagement Ring$/i, ""), price: +p.price, image: p.image?.url, claimed: false, isNew: false, sub: [p.shape, p.metal].filter(Boolean).join(" · ") || undefined }));
    preview = true;
  }
  const claimed = items.filter(i => i.claimed).length, left = items.length - claimed;
  return (
    <section className="ooo-wrap">
      <div className="ooo">
        <img className="ooo-m" src="/brand/meekitaz-m-white.png" alt="" aria-hidden="true" loading="lazy" />
        <img className="ooo-girl" src="/media/home/one-of-one.jpg" alt="" loading="lazy" />
        <div className="ooo-copy">
          <p className="ooo-eye"><i />One of One{claimed ? ` · ${claimed} claimed` : ""}</p>
          <h2 className="ooo-h">Made once.<em>Never again.</em></h2>
          <p className="ooo-lead">A single stone, a single setting, a single ring. When it&rsquo;s claimed, it&rsquo;s gone &mdash; we don&rsquo;t remake them.</p>
          <div className="ooo-row"><Link href="/collections/one-of-one" className="ooo-btn">See the one-of-ones &rarr;</Link>{items.length > 0 && !preview && <span className="ooo-cnt">{left} left of {items.length}</span>}</div>
        </div>
        {items.length > 0 && (
          <div className="ooo-rail">
            {items.slice(0, 4).map(i => (
              <Link key={i.handle} href={`/products/${i.handle}`} className={`ooo-card${i.claimed ? " is-claimed" : ""}`}>
                <span className={`ooo-badge${i.isNew && !i.claimed ? " new" : ""}`}>{preview ? "Preview" : i.claimed ? "Claimed" : i.isNew ? "New" : "1 of 1"}</span>
                <span className="ooo-im">{i.image && <img src={photoSrc(i.image, 500, i.title)} alt={i.title} loading="lazy" />}{i.claimed && <span className="ooo-sold"><span>Claimed</span></span>}</span>
                <b>{i.title}</b>{i.sub && <span>{i.sub}</span>}<em>{usd(i.price)}</em>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
