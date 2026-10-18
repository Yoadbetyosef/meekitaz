import Image from "next/image";
import Link from "next/link";
import { getProductsByQuery, ringShapeOf, shopifyConfigured, type Product } from "@/lib/shopify";
import { FANCY_COLORS, FANCY_QUERY, fancyColorOf } from "@/lib/fancy";
import { brandify } from "@/lib/text";
import { photoSrc, isCleaned } from "@/lib/img";

const TINT: Record<string, string> = { Pink: "#e8527f", Blue: "#2f6fdb", Yellow: "#e9b911", Green: "#2fa26a" };
const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);

/** The catalogue pieces already set with a coloured diamond, by colour. A ring here is a setting: its page leads to the fancy stones in its colour. */
export default async function FancyPieces({ color, style }: { color: string; style: string }) {
  if (!shopifyConfigured) return null;
  const all: (Product & { color: string; shape: string })[] = [];
  let after: string | null = null;
  for (let i = 0; i < 4; i++) { // up to ~100 pieces
    const r = await getProductsByQuery(FANCY_QUERY, { first: 24, after, sort: "best" });
    if (!r) break;
    r.products.forEach(p => { const c = fancyColorOf(p.title); if (c) all.push({ ...p, title: brandify(p.title), color: c, shape: ringShapeOf([], p.title) }); });
    if (!r.hasNext) break; after = r.cursor;
  }
  if (!all.length) return null;
  const counts = Object.fromEntries(FANCY_COLORS.map(c => [c, all.filter(p => p.color === c).length]));
  const pick = FANCY_COLORS.includes(color as never) ? color : "";
  const items = all.filter(p => (!pick || p.color === pick) && (!style || p.shape === style));
  const link = (c: string) => `/fancy-colors${c ? `?color=${c}` : ""}${style ? `${c ? "&" : "?"}style=${encodeURIComponent(style)}` : ""}#fancy-pieces`;
  return (
    <section className="grid-wrap fp" id="fancy-pieces" aria-label="Fancy colour jewellery">
      <div className="wrap">
        <div className="sp-head"><small className="eyebrow">Set in colour</small><h2>Fancy colour jewellery</h2></div>
        <div className="fp-chips">
          <Link href={link("")} className={`fp-chip${!pick ? " on" : ""}`}>All</Link>
          {FANCY_COLORS.filter(c => counts[c]).map(c => <Link key={c} href={link(c)} className={`fp-chip${pick === c ? " on" : ""}`}><i style={{ background: TINT[c] }} />{c}<small>{counts[c]}</small></Link>)}
          {style && <Link href={link(pick)} className="fp-chip on">{style} ×</Link>}
        </div>
        {items.length ? (
          <div className="pgrid">
            {items.map(p => (
              <Link key={p.id} href={`/products/${p.handle}`} className="pcard">
                <div className="pcard-img">{p.image && <Image src={photoSrc(p.image.url, 700, p.title)} alt={p.image.alt} width={800} height={800} sizes="(max-width:767px) 50vw, 380px" quality={75} unoptimized={isCleaned(photoSrc(p.image.url, 700, p.title))} />}</div>
                <div className="pcard-txt"><b>{p.title}</b><span className="price">{usd(p.price, p.currency)}{p.compareAt ? <s className="was">{usd(p.compareAt, p.currency)}</s> : null}</span></div>
              </Link>
            ))}
          </div>
        ) : <p className="fp-none">Nothing in {pick.toLowerCase()}{style ? ` ${style.toLowerCase()}` : ""} yet. Try another colour, or build one from a loose stone below.</p>}
      </div>
    </section>
  );
}
