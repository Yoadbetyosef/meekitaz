import Link from "next/link";
import { getReelByHandles } from "@/lib/shopify";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/* Home · The Reel strip: a low black band under One of One, five hand-picked pieces playing on loop, "Watch the Reel". */
const PICKS = ["reel-bc5309", "reel-er24721", "reel-eb3319", "reel-rg8537", "reel-pd2891"];

export default async function ReelStrip() {
  const items = await getReelByHandles(PICKS).catch(() => []);
  if (!items.length) return null;
  return (
    <section className="reel-strip" aria-label="Ready to Ship">
      <div className="rs-w">
        <div className="rs-head">
          <span className="rs-tag"><i />Ready to ship</span>
          <b>Ready to Ship. <em>One of each.</em></b>
          <p>2,900 filmed pieces. One of each.</p>
        </div>
        {items.map((it, i) => (
          <Link key={it.handle} href={`/ready-to-ship#${it.handle}`} className="rs-t" aria-label={it.title}>
            {it.video ? <video src={it.video} muted loop playsInline autoPlay preload={i < 3 ? "auto" : "metadata"} poster={it.image} /> : <img src={it.image} alt="" />}
            <em>{usd(it.price)}</em>
          </Link>
        ))}
        <Link href="/ready-to-ship" className="rs-more">See all<br />&rarr;</Link>
      </div>
    </section>
  );
}
