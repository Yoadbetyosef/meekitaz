import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legalPages } from "@/lib/legal";

const page = legalPages.find(p => p.slug === "privacy-policy")!;
export const metadata: Metadata = { title: page.title, description: "How Meekitaz uses cookies and handles your personal data." };
export default function Page() { return <LegalPage page={page} />; }
