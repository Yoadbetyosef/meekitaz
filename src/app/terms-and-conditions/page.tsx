import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legalPages } from "@/lib/legal";

const page = legalPages.find(p => p.slug === "terms-and-conditions")!;
export const metadata: Metadata = { title: page.title, description: "The terms for using meekitaz.com and buying from Meekitaz." };
export default function Page() { return <LegalPage page={page} />; }
