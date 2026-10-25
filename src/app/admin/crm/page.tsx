import type { Metadata } from "next";
import { crmAuthed } from "@/lib/crmAuth";
import CrmApp from "@/components/crm/CrmApp";
import CrmLogin from "@/components/crm/CrmLogin";

export const metadata: Metadata = { title: "CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  return (await crmAuthed()) ? <CrmApp /> : <CrmLogin />;
}
