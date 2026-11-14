import { notFound } from "next/navigation";
import { RTS_ON } from "@/lib/flags";
import Reel from "@/components/Reel";
import { getReel } from "@/lib/shopify";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ready to Ship — MEEKITAZ", description: "One of each. Every piece filmed, ready to ship." };
export default async function ReelPage() {
  if (!RTS_ON) notFound(); // switched off for now (src/lib/flags.ts)
  const r = await getReel(24).catch(() => ({ items: [], hasNext: false, cursor: null }));
  return <main className="rl-main"><Reel initial={r.items} hasNext={r.hasNext} cursor={r.cursor} /></main>;
}
