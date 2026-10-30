import Link from "next/link";
import { getOneOfOne, getOneOfOneByHandles } from "@/lib/shopify";

// the four pieces on the home page, chosen by hand: the toi-et-moi ring, the princess-and-pear studs, the charm necklace, the drop bracelet
const PICKS = ["one-of-one-sjr63597pe-y", "one-of-one-sjpse210110pepr", "one-of-one-sjn08248", "one-of-one-sjbr20793"];
import { photoSrc } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/* Home · under the gemstones slide: the one-of-ones. One stone, one setting, one ring; tag a product "One of One" in Shopify and it appears
   here, and when it sells it stays, stamped Claimed. The photo's own blue is the section's background, so she sits in it edge to edge. */
export default async function OneOfOne() {
  const picks = await getOneOfOneByHandles(PICKS).catch(() => []);
  const items = picks.length >= 4 ? picks : [...picks, ...(await getOneOfOne(8).catch(() => [])).filter(x => !PICKS.includes(x.handle))].slice(0, 4);
  const preview = false; // only pieces tagged "One of One" ever show here
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
          <div className="ooo-row"><Link href="/one-of-one" className="ooo-btn">See the one-of-ones &rarr;</Link></div>
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
