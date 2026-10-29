import Reel from "@/components/Reel";
import { getReel } from "@/lib/shopify";
export const dynamic = "force-dynamic";
export const metadata = { title: "The Reel — MEEKITAZ", description: "One of each. Every piece filmed. Ships in 48 hours." };
export default async function ReelPage() {
  const r = await getReel(24).catch(() => ({ items: [], hasNext: false, cursor: null }));
  return <main className="rl-main"><Reel initial={r.items} hasNext={r.hasNext} cursor={r.cursor} /></main>;
}
