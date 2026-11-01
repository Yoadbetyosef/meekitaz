import Link from "next/link";
import { getOneOfOne, getOneOfOneByHandles } from "@/lib/shopify";

// the four pieces on the home page, chosen by hand: the toi-et-moi ring, the princess-and-pear studs, the charm necklace, the drop bracelet
const PICKS = ["one-of-one-sjr63597pe-y", "one-of-one-sjpse210110pepr", "one-of-one-sjn08248", "one-of-one-sjbr20793"];
import { photoSrc } from "@/lib/img";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/* Home · the one-of-ones (layout O2 desktop / M1 phone, approved 2026-10-31): she comes in big from the left edge, standing in front of a giant
   "MADE ONCE."; "Never again.", the line and the button bottom-right, two pieces top-right (phones: words on top, her across them, text and a swipe row below).
   Previously: under the gemstones slide: the one-of-ones. One stone, one setting, one ring; tag a product "One of One" in Shopify and it appears
   here, and when it sells it stays, stamped Claimed. The photo's own blue is the section's background, so she sits in it edge to edge. */
export default async function OneOfOne() {
  const picks = await getOneOfOneByHandles(PICKS).catch(() => []);
  const items = picks.length >= 4 ? picks : [...picks, ...(await getOneOfOne(8).catch(() => [])).filter(x => !picks.some(p => p.handle === x.handle))].slice(0, 4);
  const preview = false; // only pieces tagged "One of One" ever show here
  const claimed = items.filter(i => i.claimed).length, left = items.length - claimed;
  return (
    <section className="oo2" aria-label="One of One">
      <div className="oo2-stage">
        <p className="oo2-big" aria-hidden="true">Made<br />once.</p>
        <img className="oo2-her" src="/media/home/one-of-one-scarf.webp" alt="" loading="lazy" />
      </div>
      <div className="oo2-copy">
        <p className="ooo-eye"><i />One of One{claimed ? ` · ${claimed} claimed` : ""}</p>
        <h2 className="oo2-h"><span className="oo2-sr">Made once. </span>Never again.</h2>
        <p className="oo2-lead">One stone, one setting, one ring. When it&rsquo;s claimed, it&rsquo;s gone.</p>
        <Link href="/one-of-one" className="ooo-btn">See the one-of-ones &rarr;</Link>
      </div>
      {items.length > 0 && (
        <div className="oo2-rail">
          {items.slice(0, 4).map(i => (
            <Link key={i.handle} href={`/products/${i.handle}`} className={`ooo-card${i.claimed ? " is-claimed" : ""}`}>
              <span className="ooo-im">{i.image && <img src={photoSrc(i.image, 500, i.title)} alt={i.title} loading="lazy" />}{i.claimed && <span className="ooo-sold"><span>Claimed</span></span>}</span>
              <b>{i.title}</b>{i.sub && <span>{i.sub}</span>}<em>{usd(i.price)}</em>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
