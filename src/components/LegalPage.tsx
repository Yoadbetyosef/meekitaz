import Link from "next/link";
import type { Block, LegalPage as Page } from "@/lib/legal";

/** **bold** and [label](href) inside a string. */
function rich(s: string, key: string) {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-${i++}`}>{m[1]}</strong>);
    else if (m[3].startsWith("/")) out.push(<Link key={`${key}-${i++}`} href={m[3]}>{m[2]}</Link>);
    else out.push(<a key={`${key}-${i++}`} href={m[3]}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function BlockView({ b, i }: { b: Block; i: number }) {
  if ("h" in b) return <h2>{b.h}</h2>;
  if ("h3" in b) return <h3>{b.h3}</h3>;
  if ("p" in b) return <p>{rich(b.p, `p${i}`)}</p>;
  if ("ul" in b) return <ul>{b.ul.map((t, k) => <li key={k}>{rich(t, `u${i}-${k}`)}</li>)}</ul>;
  return <ol>{b.ol.map((t, k) => <li key={k}>{rich(t, `o${i}-${k}`)}</li>)}</ol>;
}

export default function LegalPage({ page }: { page: Page }) {
  return (
    <main className="lg">
      <div className="wrap lg-in">
        <small className="eyebrow">{page.eyebrow}</small>
        <h1 className="lg-h1">{page.title}</h1>
        <p className="lg-up">Last updated {page.updated}</p>
        <div className="lg-body">{page.blocks.map((b, i) => <BlockView key={i} b={b} i={i} />)}</div>
      </div>
    </main>
  );
}
