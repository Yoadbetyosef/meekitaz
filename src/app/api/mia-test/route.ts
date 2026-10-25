import { NextRequest, NextResponse } from "next/server";

// TEMPORARY: scripted test runs against Mia (visitor "test-…", no team emails). Removed after the review.
export const maxDuration = 60;
const TOKEN = "5d14a000ebd23524080c6669";
const SINGLE: string[] = [
  "Can I get a discount?", "I found the same ring cheaper on another site.", "Is this price final or can we negotiate?", "Do you have any Black Friday sales coming?",
  "Why are your prices so much lower than Tiffany?", "Can I use two discount codes?", "The crossed-out price says $3,398, is that real?", "Do you offer military or student discounts?",
  "Is a lab diamond a real diamond?", "Will a lab diamond lose its value?", "What color and clarity should I choose?", "I want the biggest diamond I can get for $3,000.",
  "Does a $3,000 budget include the setting?", "Can I see the diamond in a video?", "Is a VS2 diamond eye-clean?", "Can you hold a diamond for me until next week?",
  "Do you have pink or yellow diamonds?", "Do you have natural diamonds? How much is a 2 ct natural?", "What's the difference between IGI and GIA?", "Can I buy just a loose diamond?",
  "I like the oval hidden halo ring but I want it in a pear shape.", "Can you make the band thinner?", "I want to combine two rings I saw into one.", "Can you copy a ring from a photo I have?",
  "How long does a custom design take?", "Is there an extra cost for a custom design?", "Can I add diamonds to the band?", "Can I see the ring on a hand?",
  "Can I engrave a message inside the ring?", "Do you have matching wedding bands?", "I don't know her ring size, it's a surprise.", "Can I order a quarter size?",
  "What if the size is wrong?", "Can an eternity band be resized?", "Can you send me a ring sizer?", "I need the ring by next Friday.",
  "Do you offer express shipping?", "Can you ship to my office?", "Can I pick it up at the showroom?", "Do you ship to Canada?",
  "Is the package discreet? It's a surprise proposal.", "Where is my order?", "I want to return my ring.", "Can I return a custom ring?",
  "I lost the certificate, can I still return it?", "I want to cancel my order.", "She said no, can I return the ring?", "A stone fell out of my ring.",
  "Can I add a care package after I already bought?", "My white gold ring looks yellow.", "Do you have insurance for the ring?", "Can I upgrade my diamond later?",
  "Can I pay monthly?", "My card was declined.", "Can I pay with Zelle?", "Can I pay a deposit and the rest later?",
  "Is it safe to buy online from you?", "Can I come to the showroom tomorrow?", "What are your showroom hours?", "Can we do a video call right now?",
  "Where exactly is the showroom?", "Are you a real store or a scam?", "Can I talk to a real person?", "Are your diamonds ethically sourced?",
  "Do you have reviews?", "Who makes your jewelry?", "Is this the same company as Nature Sparkle?", "Hola, busco un anillo de compromiso",
  "hi", "I'm torn between a round solitaire and an oval halo.", "This is ridiculous, nobody answered my email for 3 days!", "What's the weather like in New York?",
  "Show me something special", "I'm a guy, I want to propose next month, help me", "I'll think about it", "The ring I wanted is sold out",
  "I want something under $500", "I need a gift for my mom", "What's your best seller?", "Do you charge sales tax?",
  "Can you put my grandmother's diamond in a new setting?", "Do you buy gold or diamonds?", "Do you make men's engagement rings?", "I'm an influencer, can we work together?",
  "Can you rush a CAD today?", "I want a ring with my birthstone.", "Can you ship one order to two addresses?", "Do you have gift cards?",
  "I live in the UK, does the warranty work for me?", "Can I see a certificate before buying?", "Show me diamond stud earrings", "Show me tennis bracelets",
  "Show me a yellow gold wedding band", "Do you have a 1 carat round in platinum?", "What is the free studs offer?", "How much is the lifetime care package?",
  "Show me a 2 carat emerald cut, D color", "I want a pear shaped ring under $2,000", "Do you have toi et moi rings?", "What's your return policy?",
];
const FLOWS: string[][] = [
  ["Show me a 2 carat oval, D to F color, VVS", "Show me a hidden halo setting for the first one", "Add the first setting with the first diamond in 14K yellow gold", "I'm ready to check out"],
  ["Show me diamond stud earrings", "Add the first one to my bag"],
  ["I want a 3 carat pear", "show me a hidden halo setting for it", "add the second one"],
];
type R = { id?: string; reply?: string; error?: string; products?: { title: string; price: string }[]; chips?: string[]; actions?: unknown[] };
async function talk(base: string, turns: string[], tag: string) {
  let id: string | null = null; const out: string[] = [];
  for (const m of turns) {
    const r: R = await fetch(base + "/api/mia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m, conversationId: id, visitorId: "test-claude", page: "/test" }) }).then(x => x.json()).catch(e => ({ error: String(e) }));
    id = r.id || id;
    out.push(`CUSTOMER: ${m}`, `MIA: ${r.reply ?? r.error ?? "(none)"}`);
    if (r.products?.length) out.push("  cards: " + r.products.map(p => p.title + " " + p.price).join(" | "));
    if (r.chips?.length) out.push("  buttons: " + r.chips.join(" | "));
    if (r.actions?.length) out.push("  actions: " + JSON.stringify(r.actions));
  }
  return `### ${tag}\n` + out.join("\n");
}
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("t") !== TOKEN) return NextResponse.json({ error: "no" }, { status: 404 });
  const base = req.nextUrl.origin;
  if (sp.get("flow")) { const f = FLOWS[Number(sp.get("flow"))]; if (!f) return NextResponse.json({ count: FLOWS.length }); return new NextResponse(await talk(base, f, "flow " + sp.get("flow")), { headers: { "content-type": "text/plain; charset=utf-8" } }); }
  const from = Number(sp.get("from") || 0), n = Math.min(Number(sp.get("n") || 10), 12);
  const qs = SINGLE.slice(from, from + n);
  const res = await Promise.all(qs.map((q, k) => talk(base, [q], `Q${from + k + 1}`)));
  return new NextResponse(res.join("\n\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
