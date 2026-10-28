import { sql, ensureSchema } from "./db";

/* Saved bags ("email me my bag" + the exit prompt): the bag is saved with the shopper's email, the link that rebuilds it goes out
   right away, and a reminder follows 24 hours later unless the link was opened. Rings (setting + diamond) are rebuilt in the
   browser from the saved objects; plain products are shown with links to their pages. */
export type SavedItem = { title: string; sub?: string; price: number; image?: string; url?: string };
export type SavedBag = { email: string; items: SavedItem[]; rings: unknown[]; total: number };

const esc = (s: string) => String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.meekitaz.com").replace(/\/$/, "");

async function schema() { await ensureSchema(); await sql!`CREATE TABLE IF NOT EXISTS saved_bags (id TEXT PRIMARY KEY, email TEXT NOT NULL, data JSONB NOT NULL, total NUMERIC NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), sent1_at TIMESTAMPTZ, sent2_at TIMESTAMPTZ, opened_at TIMESTAMPTZ)`; }

function mail(bag: SavedBag, id: string, second: boolean) {
  const link = `${SITE()}/bag/${id}`;
  const rows = bag.items.map(i => `<tr><td style="padding:10px 12px 10px 0;width:72px">${i.image ? `<img src="${esc(i.image)}" alt="" width="64" height="64" style="border-radius:12px;display:block;object-fit:cover;background:#fff">` : ""}</td><td style="padding:10px 0"><b style="font:400 16px Georgia,serif">${esc(i.title)}</b>${i.sub ? `<br><span style="font:13px Arial;color:#6b6568">${esc(i.sub)}</span>` : ""}</td><td style="padding:10px 0;text-align:right;font:600 14px Arial">${usd(i.price)}</td></tr>`).join("");
  const title = second ? "Still thinking about it?" : "Your bag, saved.";
  const lead = second ? "It\u2019s all still here, exactly as you left it. Lab-grown, IGI/GIA certified, free insured shipping and 30-day returns." : "Here\u2019s everything you picked, ready whenever you are. One tap brings it all back.";
  const html = `<div style="font-family:Georgia,serif;color:#1C1A1B;max-width:560px;margin:auto;padding:32px;background:#FDF8F3">
<p style="font:700 11px Arial;letter-spacing:.3em;text-transform:uppercase;color:#7E0508;margin:0 0 14px">Meekitaz</p>
<h1 style="font-weight:400;font-size:30px;margin:0 0 10px">${title}</h1>
<p style="font:15px/1.6 Arial;margin:0 0 18px">${lead}</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd6;border-bottom:1px solid #e6dfd6">${rows}</table>
<p style="font:600 15px Arial;text-align:right;margin:12px 0 22px">Total ${usd(bag.total)}</p>
<p style="text-align:center;margin:0 0 22px"><a href="${link}" style="display:inline-block;background:#1C1A1B;color:#fff;text-decoration:none;border-radius:999px;padding:16px 28px;font:700 12px Arial;letter-spacing:.14em;text-transform:uppercase">Pick up where I left off</a></p>
<p style="font:13px/1.6 Arial;color:#6b6568;margin:0">Questions? Just reply to this email, or <a href="${SITE()}/#contact" style="color:#1C1A1B">book a private appointment</a> at our New York showroom.</p>
<p style="margin-top:24px;font-style:italic">Meekitaz · New York</p></div>`;
  const text = `${title}\n\n${bag.items.map(i => `${i.title} — ${usd(i.price)}`).join("\n")}\nTotal ${usd(bag.total)}\n\nPick up where you left off: ${link}`;
  return { subject: second ? "Still thinking about it? Your Meekitaz bag is waiting" : "Your Meekitaz bag, saved", html, text };
}
async function send(to: string, m: { subject: string; html: string; text: string }) {
  if (!process.env.RESEND_API_KEY) return false;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [to], reply_to: process.env.CONTACT_TO || "sales@meekitaz.com", ...m }) }).catch(() => null);
  return !!r?.ok;
}

/** Saves the bag and emails the link right away. Returns the bag id. */
export async function saveBag(bag: SavedBag): Promise<string | null> {
  if (!sql) return null;
  await schema();
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  await sql`INSERT INTO saved_bags (id, email, data, total) VALUES (${id}, ${bag.email.toLowerCase()}, ${JSON.stringify(bag)}::jsonb, ${bag.total})`;
  if (await send(bag.email, mail(bag, id, false))) await sql`UPDATE saved_bags SET sent1_at=now() WHERE id=${id}`;
  return id;
}
export async function loadBag(id: string): Promise<SavedBag | null> {
  if (!sql) return null; await schema();
  const r = await sql`SELECT data FROM saved_bags WHERE id=${id}`; return r[0] ? (r[0].data as SavedBag) : null;
}
export async function markOpened(id: string) { if (!sql) return; await schema(); await sql`UPDATE saved_bags SET opened_at=COALESCE(opened_at, now()) WHERE id=${id}`; }
/** Cron: the 24-hour reminder, once, only for bags whose link was never opened. */
export async function sendReminders(): Promise<number> {
  if (!sql) return 0; await schema();
  const due = await sql`SELECT id, email, data FROM saved_bags WHERE sent2_at IS NULL AND opened_at IS NULL AND created_at < now() - interval '24 hours' AND created_at > now() - interval '7 days' ORDER BY created_at LIMIT 40`;
  let n = 0;
  for (const r of due) {
    const ok = await send(r.email as string, mail(r.data as SavedBag, r.id as string, true));
    await sql`UPDATE saved_bags SET sent2_at=now() WHERE id=${r.id as string}`; // sent or not, never nag twice
    if (ok) n++;
  }
  return n;
}
