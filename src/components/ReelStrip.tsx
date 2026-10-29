import Link from "next/link";
import { getReelByHandles } from "@/lib/shopify";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/* Home · The Reel strip: a low black band under One of One, five hand-picked pieces playing on loop, "Watch the Reel". */
const PICKS = ["reel-bc5309", "reel-er24721", "reel-eb3319", "reel-rg8537", "reel-pd2891"];

export default async function ReelStrip() {
  const items = await getReelByHandles(PICKS).catch(() => []);
  if (!items.length) return null;
  return (
    <section className="reel-strip" aria-label="The Reel">
      <div className="rs-w">
        <div className="rs-head">
          <span className="rs-tag"><i />Ready to ship</span>
          <b>The Reel. <em>One of each.</em></b>
          <p>2,900 filmed pieces. Ships in 48h.</p>
        </div>
        {items.map((it, i) => (
          <Link key={it.handle} href={`/reel#${it.handle}`} className="rs-t" aria-label={it.title}>
            {it.video ? <video src={it.video} muted loop playsInline autoPlay preload={i < 3 ? "auto" : "metadata"} poster={it.image} /> : <img src={it.image} alt="" />}
            <em>{usd(it.price)}</em>
          </Link>
        ))}
        <Link href="/reel" className="rs-more">Watch<br />the Reel &rarr;</Link>
      </div>
    </section>
  );
}
