import { notFound } from "next/navigation";
import RingSteps from "@/components/RingSteps";
import DiamondFlow, { type FlowStone, type Similar } from "@/components/DiamondFlow";
import { getDiamond, searchDiamonds, searchFancy, vdbConfigured, type Diamond } from "@/lib/vdb";
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
  return { title: d ? `${d.carat.toFixed(2)} ct ${d.shape} lab-grown diamond — MEEKITAZ` : "Diamond — MEEKITAZ" };
}

const flow = (d: Diamond): FlowStone => ({
  vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, polish: d.polish, symmetry: d.symmetry, fluor: d.fluor,
  lab: d.lab, cert: d.cert, certUrl: d.certUrl, image: d.image, video: d.video, embed: d.embed, price: d.price, fancy: d.fancy, ratio: d.ratio, depth: d.depth, table: d.table, measurements: d.measurements,
});

/** The four stones closest in size: same shape, same kind (white or the same fancy colour). Quiet failure: no list rather than a broken page. */
async function similarOf(d: Diamond): Promise<Diamond[]> {
  try {
    const lo = Math.max(0.3, +(d.carat * 0.78).toFixed(2)), hi = +(d.carat * 1.3).toFixed(2);
    const pool = d.fancy
      ? (await searchFancy({ color: d.fancyColor || undefined, shapes: [d.shape], caratFrom: lo, caratTo: hi })).items
      : (await searchDiamonds({ shapes: [d.shape], caratFrom: lo, caratTo: hi, sort: "price_asc", pageSize: 50 })).items.filter(x => !x.fancy);
    return pool.filter(x => x.image && !(x.vendor === d.vendor && x.stock === d.stock))
      .sort((a, b) => Math.abs(a.carat - d.carat) - Math.abs(b.carat - d.carat) || a.price - b.price).slice(0, 4);
  } catch { return []; }
}

export default async function DiamondPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  if (!d) notFound();
  const [bg, sim] = await Promise.all([stoneBg(d.image), similarOf(d)]);
  const simBg = await Promise.all(sim.map(x => stoneBg(x.image, 1200)));
  const similar: Similar[] = sim.map((x, i) => ({ ...flow(x), bg: simBg[i] }));
  return (
    <main className="df">
      {!d.fancy && <RingSteps step={2} />}
      <DiamondFlow d={flow(d)} bg={bg} similar={similar} />
    </main>
  );
}
