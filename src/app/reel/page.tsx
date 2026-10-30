import Reel from "@/components/Reel";
import { getReel } from "@/lib/shopify";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ready to Ship — MEEKITAZ", description: "One of each. Every piece filmed, ready to ship." };
export default async function ReelPage() {
  const r = await getReel(24).catch(() => ({ items: [], hasNext: false, cursor: null }));
  return <main className="rl-main"><Reel initial={r.items} hasNext={r.hasNext} cursor={r.cursor} /></main>;
}
