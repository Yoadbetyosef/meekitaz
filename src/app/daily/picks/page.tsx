import type { Metadata } from "next";
import { getDailyItems } from "@/components/DailyPlanSection";
import DailyPicks from "@/components/DailyPicks";
export const metadata: Metadata = { title: "Picked for your plan · Meekitaz Daily", robots: { index: false, follow: false } };
export const revalidate = 300;
/* Meekitaz Daily (2026-11-09): after "Start at $X a day" — everything that fits the plan, and a row that's just a little more. */
export default async function Page() { return <main className="daily-page pk-page"><DailyPicks items={await getDailyItems()} /></main>; }
