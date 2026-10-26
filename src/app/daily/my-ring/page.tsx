import type { Metadata } from "next";
import DailyMyRing from "@/components/DailyMyRing";
export const metadata: Metadata = { title: "My ring · Meekitaz Daily", robots: { index: false, follow: false } };
export default function Page() { return <DailyMyRing />; }
