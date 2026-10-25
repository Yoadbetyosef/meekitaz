import type { Metadata } from "next";
import FaqList from "@/components/FaqList";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = { title: "FAQ", description: "Answers about custom rings, diamonds, sizing, shipping, returns, warranty and care at Meekitaz." };

export default function Page() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.flatMap(s => s.items.map(i => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") } }))) };
  return (
    <main className="fq">
      <div className="wrap fq-in">
        <small className="eyebrow">Help</small>
        <h1 className="fq-h1">Questions, answered.</h1>
        <p className="fq-sub">Everything about rings, diamonds, sizing, shipping and care.</p>
        <FaqList sections={FAQ} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}
