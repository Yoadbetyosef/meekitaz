import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legalPages } from "@/lib/legal";

const page = legalPages.find(p => p.slug === "return-policy")!;
export const metadata: Metadata = { title: page.title, description: "Free 30-day returns on every Meekitaz order." };
export default function Page() { return <LegalPage page={page} />; }
