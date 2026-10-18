import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiamond, vdbConfigured } from "@/lib/vdb";

export const revalidate = 300;
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

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

export default async function DiamondPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  if (!d) notFound();
  const rows: [string, string | null][] = [
    ["Shape", d.shape], ["Carat", d.carat.toFixed(2)], ["Color", d.color], ["Clarity", d.clarity], ["Cut", d.cut], ["Polish", d.polish],
    ["Symmetry", d.symmetry], ["Fluorescence", d.fluor], ["Measurements", d.measurements], ["Table", d.table ? d.table + "%" : null],
    ["Depth", d.depth ? d.depth + "%" : null], ["Ratio", d.ratio], ["Certificate", `${d.lab} ${d.cert}`],
  ];
  return (
    <main className="dd">
      <div className="wrap dd-grid">
        <div className="dd-media">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.image} alt={`${d.carat.toFixed(2)} carat ${d.shape} diamond`} referrerPolicy="no-referrer" /></div>
        <div className="dd-info">
          <Link href="/diamonds" className="dd-back">← All diamonds</Link>
          <small className="eyebrow">Lab-grown · {d.lab} certified</small>
          <h1>{d.carat.toFixed(2)} ct {d.shape}</h1>
          <p className="dd-sub">{[d.color && `${d.color} color`, d.clarity && `${d.clarity} clarity`, d.cut && `${d.cut} cut`].filter(Boolean).join(" · ")}</p>
          <div className="dd-price">{usd(d.price)}</div>
          <div className="dd-cta">
            <Link href="/#contact" className="pill">Book a private appointment</Link>
            {d.video && <a href={d.video} target="_blank" rel="noopener noreferrer" className="dd-ghost">360° view</a>}
            <a href={d.certUrl} target="_blank" rel="noopener noreferrer" className="dd-ghost">View certificate</a>
          </div>
          <dl className="dd-specs">{rows.filter(r => r[1]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      </div>
    </main>
  );
}
