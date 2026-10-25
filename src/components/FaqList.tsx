"use client";
import { useState } from "react";
import Link from "next/link";
import type { FaqSection } from "@/lib/faq";

function rich(s: string) {
  const out: React.ReactNode[] = []; const re = /\[([^\]]+)\]\(([^)]+)\)/g; let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) { if (m.index > last) out.push(s.slice(last, m.index)); out.push(m[2].startsWith("/") ? <Link key={i++} href={m[2]}>{m[1]}</Link> : <a key={i++} href={m[2]}>{m[1]}</a>); last = m.index + m[0].length; }
  if (last < s.length) out.push(s.slice(last)); return out;
}

export default function FaqList({ sections }: { sections: FaqSection[] }) {
  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();
  const shown = sections.map(s => ({ ...s, items: s.items.filter(i => !t || (i.q + " " + i.a).toLowerCase().includes(t)) })).filter(s => s.items.length);
  return (
    <>
      <input className="fq-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search: resize, shipping, 4 carat, natural diamonds…" aria-label="Search questions" />
      <nav className="fq-chips">{sections.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</nav>
      {shown.map(s => (
        <section className="fq-sec" id={s.id} key={s.id}>
          <h2>{s.title}</h2>
          {s.items.map(i => <details className="fq-qa" key={i.q} open={!!t}><summary>{i.q}</summary><p>{rich(i.a)}</p></details>)}
        </section>
      ))}
      {!shown.length && <p className="fq-none">No answer found. Write to us at <a href="mailto:sales@meekitaz.com">sales@meekitaz.com</a>.</p>}
    </>
  );
}
