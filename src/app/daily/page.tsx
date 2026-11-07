import type { Metadata } from "next";
import DailyPlanSection from "@/components/DailyPlanSection";
export const metadata: Metadata = { title: "Meekitaz Daily · from $1 a day", robots: { index: false, follow: false } };
export const revalidate = 300;
/* Meekitaz Daily (2026-11-07): the plan section from the home page — the statement, the badges, the reviews and the live plan ticket. */
export default function Page() { return <main className="daily-page"><DailyPlanSection /></main>; }
