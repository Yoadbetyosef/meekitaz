import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "It’s yours · Meekitaz", robots: { index: false, follow: false } };
/* Order confirmed (approved 2026-11-08): the ring box with its bow, a little confetti of our drawings — "It's yours." */
const CONF: [string, string, number, number][] = [["cherries", "left:8%;top:14%", -12, 64], ["croissant", "right:9%;top:16%", 14, 62], ["martini", "left:12%;bottom:16%", 8, 64], ["fries", "right:11%;bottom:14%", -10, 70]];
export default async function OrderConfirmed({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <main className="mk-oc">
      {CONF.map(([n, pos, r, h]) => <i key={n} className="mk-ic mk-oc-c" aria-hidden="true" style={{ ...Object.fromEntries(pos.split(";").map(x => x.split(":"))), transform: `rotate(${r}deg)`, height: h, width: Math.round(h * .7), ["--src" as string]: `url(/media/icons/${n}.png)` }} />)}
      <div>
        <i className="mk-ic mk-pop" aria-hidden="true" style={{ ["--src" as string]: "url(/media/icons/ringbox.png)", width: 116, height: 158 }} />
        <small>{order ? `Order ${order} · confirmed` : "Order confirmed"}</small>
        <h1>It&rsquo;s yours.</h1>
        <p className="mk-it">We&rsquo;ll be in touch when it&rsquo;s on its way.</p>
        <Link href="/" className="mk-404-btn">Back to Meekitaz</Link>
      </div>
    </main>
  );
}
