import { NextRequest, NextResponse } from "next/server";

// TEMPORARY: runs scripted conversations against Mia for a review. Removed after the test.
export const maxDuration = 60;
const TOKEN = "5d14a000ebd23524080c6669";
const S: string[][] = [
  ["Can I get a discount?"],
  ["Show me a 4 carat oval", "D color VVS", "Show me a hidden halo setting for the first one"],
  ["Do you sell loose diamonds?"],
  ["I found the same ring cheaper on another site"],
  ["I need an engagement ring by next Friday"],
  ["Do you have natural diamonds? How much is a 2 carat?"],
  ["What are your showroom hours and where are you?"],
  ["Is this the same company as Nature Sparkle?"],
  ["My ring is too big, what do I do?"],
  ["hi"],
  ["Can I pay monthly for a 4000 dollar ring?"],
  ["Can I talk to a real person?"],
];
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("t") !== TOKEN) return NextResponse.json({ error: "no" }, { status: 404 });
  const i = Number(req.nextUrl.searchParams.get("s") || 0); const turns = S[i]; if (!turns) return NextResponse.json({ error: "range", count: S.length });
  const base = req.nextUrl.origin; let id: string | null = null; const out: string[] = [];
  for (const m of turns) {
    const r = await fetch(base + "/api/mia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m, conversationId: id, visitorId: "test-claude", page: "/test" }) }).then(x => x.json()).catch(e => ({ error: String(e) }));
    id = r.id || id;
    out.push("CUSTOMER: " + m);
    out.push("MIA: " + (r.reply ?? r.error ?? "(none)"));
    if (r.products?.length) out.push("  cards: " + r.products.map((p: { title: string; price: string }) => p.title + " " + p.price).join(" | "));
    if (r.chips?.length) out.push("  buttons: " + r.chips.join(" | "));
    if (r.actions?.length) out.push("  actions: " + JSON.stringify(r.actions).slice(0, 200));
  }
  return new NextResponse(out.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
