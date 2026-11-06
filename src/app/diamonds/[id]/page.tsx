import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import RingSteps from "@/components/RingSteps";
import DiamondFlow, { type FlowStone, type Similar } from "@/components/DiamondFlow";
import { getDiamond, searchDiamonds, searchFancy, vdbConfigured, SHAPES, type Diamond } from "@/lib/vdb";
import { stoneBg } from "@/lib/stonebg";

export const revalidate = 300;

async function load(id: string) {
  const i = id.indexOf("-"); if (i < 1 || !vdbConfigured) return null;
  const vendor = Number(id.slice(0, i)), stock = decodeURIComponent(id.slice(i + 1));
  if (!isFinite(vendor)) return null;
  try { return await getDiamond(vendor, stock); } catch { return null; }
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  return { title: d ? `${d.carat.toFixed(2)} ct ${d.shape} lab-grown diamond — MEEKITAZ` : "Diamond — MEEKITAZ", robots: { index: false, follow: true } };
}

const flow = (d: Diamond): FlowStone => ({
  vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, polish: d.polish, symmetry: d.symmetry, fluor: d.fluor,
  lab: d.lab, cert: d.cert, certUrl: d.certUrl, image: d.image, video: d.video, embed: d.embed, price: d.price, fancy: d.fancy, ratio: d.ratio, depth: d.depth, table: d.table, measurements: d.measurements,
});

/** The four stones closest in size: same shape, same kind (white or the same fancy colour). Quiet failure: no list rather than a broken page. */
async function similarOf(d: Diamond): Promise<Diamond[]> {
  try {
    // Search by the base shape the supplier understands ("Elongated Cushion" → "Cushion"), then keep only the same shape
    const base = SHAPES.includes(d.shape) ? d.shape : SHAPES.find(s => d.shape.toLowerCase().includes(s.toLowerCase())) || d.shape;
    const same = (x: Diamond) => x.shape === d.shape, family = (x: Diamond) => x.shape.toLowerCase().includes(base.toLowerCase());
    const lo = Math.max(0.3, +(d.carat * 0.78).toFixed(2)), hi = +(d.carat * 1.3).toFixed(2);
    const pool = d.fancy
      ? (await searchFancy({ color: d.fancyColor || undefined, shapes: [base], caratFrom: lo, caratTo: hi })).items
      : (await searchDiamonds({ shapes: [base], caratFrom: lo, caratTo: hi, sort: "price_asc", pageSize: 50 })).items.filter(x => !x.fancy);
    const ok = pool.filter(x => x.image && !(x.vendor === d.vendor && x.stock === d.stock) && family(x));
    const exact = ok.filter(same);
    return (exact.length >= 4 ? exact : [...exact, ...ok.filter(x => !same(x))])
      .sort((a, b) => Number(same(b)) - Number(same(a)) || Math.abs(a.carat - d.carat) - Math.abs(b.carat - d.carat) || a.price - b.price).slice(0, 4);
  } catch { return []; }
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/* the similar stones, streamed after the main stone (2026-11-06): the page no longer waits for a second search and four photo reads */
async function SimilarStones({ d }: { d: Diamond }) {
  const sim = await similarOf(d);
  if (!sim.length) return null;
  const simBg = await Promise.all(sim.map(x => stoneBg(x.image, 1200)));
  const similar: Similar[] = sim.map((x, i) => ({ ...flow(x), bg: simBg[i] }));
  const shape = d.shape === "Elongated Cushion" ? "Cushion" : d.shape, kind = d.fancy ? "fancy color" : "";
  return (
    <section className="df-sec">
      <span className="eyebrow">Similar stones</span><h2>Other {shape.toLowerCase()} {kind && kind + " "}diamonds you may like</h2>
      <div className="df-sim">
        {similar.map(x => {
          const dc = x.carat - d.carat, dp = x.price - d.price;
          return (
            <Link key={`${x.vendor}-${x.stock}`} href={`/diamonds/${x.vendor}-${encodeURIComponent(x.stock)}`}>
              <div className="df-im" style={{ "--bgc": x.bg } as React.CSSProperties}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.image} alt={`${x.carat.toFixed(2)} carat ${x.shape} diamond`} referrerPolicy="no-referrer" loading="lazy" /></div>
              <div className="df-tx"><b>{x.carat.toFixed(2)} ct</b><span>{x.fancy || `${x.color} · ${x.clarity}`} · {x.lab}</span><span className="df-pr">{usd(x.price)}</span><em>{dc >= 0 ? "+" : "−"}{Math.abs(dc).toFixed(2)} ct · {dp >= 0 ? "+" : "−"}{usd(Math.abs(dp))}</em></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function DiamondPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  if (!d) notFound();
  const bg = await stoneBg(d.image, 900); // the backdrop colour of the stone's photo (capped, cached)
  return (
    <main className="df">
      {!d.fancy && <RingSteps step={2} />}
      <DiamondFlow d={flow(d)} bg={bg} similar={[]} similarSlot={<Suspense fallback={null}><SimilarStones d={d} /></Suspense>} />
    </main>
  );
}
