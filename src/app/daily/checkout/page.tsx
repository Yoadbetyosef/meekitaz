import type { Metadata } from "next";
import DailyCheckout from "@/components/DailyCheckout";
export const metadata: Metadata = { title: "Start your plan · Meekitaz Daily", robots: { index: false, follow: false } };
export default function Page() { return <DailyCheckout />; }
