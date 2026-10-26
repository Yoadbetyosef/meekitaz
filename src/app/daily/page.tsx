import type { Metadata } from "next";
import DailyHow from "@/components/DailyHow";
export const metadata: Metadata = { title: "Meekitaz Daily · $15 a day", robots: { index: false, follow: false } };
export default function Page() { return <DailyHow />; }
