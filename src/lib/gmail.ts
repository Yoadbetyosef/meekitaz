import { getIntegration, setIntegration, firstSeen, inbound } from "./db";

/* Gmail: OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET), read new inbox mail into the CRM, send replies in the same Gmail thread. */
const SCOPES = "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email openid";
export const gmailRedirect = (origin: string) => `${origin}/api/crm/google/callback`;
export const gmailConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
type G = { refresh_token: string; email: string; access_token?: string; exp?: number; last?: number };

export function gmailAuthUrl(origin: string, state: string) {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: gmailRedirect(origin), response_type: "code", scope: SCOPES, access_type: "offline", prompt: "consent", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}
export async function gmailExchange(origin: string, code: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: gmailRedirect(origin), grant_type: "authorization_code" }) });
  const j = await r.json(); if (!j.refresh_token) throw new Error(j.error_description || j.error || "no refresh token");
  const me = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${j.access_token}` } }).then(x => x.json());
  await setIntegration("gmail", { refresh_token: j.refresh_token, email: me.emailAddress, access_token: j.access_token, exp: Date.now() + j.expires_in * 1000, last: Math.floor(Date.now() / 1000) - 86400 });
  return me.emailAddress as string;
}
async function token(): Promise<{ t: string; g: G } | null> {
  const g = await getIntegration<G>("gmail"); if (!g) return null;
  if (g.access_token && g.exp && g.exp - Date.now() > 120000) return { t: g.access_token, g };
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: g.refresh_token, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, grant_type: "refresh_token" }) });
  const j = await r.json(); if (!j.access_token) throw new Error("gmail token: " + (j.error || r.status));
  const n = { ...g, access_token: j.access_token, exp: Date.now() + j.expires_in * 1000 }; await setIntegration("gmail", n); return { t: j.access_token, g: n };
}
const api = async (t: string, path: string, init: RequestInit = {}) => {
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`gmail ${r.status} ${(await r.text()).slice(0, 200)}`); return r.json();
};
type Part = { mimeType: string; body?: { data?: string }; parts?: Part[]; headers?: { name: string; value: string }[] };
const b64 = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
function plain(p: Part): string {
  if (p.mimeType === "text/plain" && p.body?.data) return b64(p.body.data);
  for (const c of p.parts || []) { const t = plain(c); if (t) return t; }
  if (p.mimeType === "text/html" && p.body?.data) return b64(p.body.data).replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+\n/g, "\n").trim();
  return "";
}
/** strips quoted history ("On … wrote:") so the CRM shows just the new message */
const fresh = (t: string) => t.split(/\n(?:On .{5,120} wrote:|-{2,} ?Original Message|From: .+\nSent: )/)[0].replace(/\n>.*$/gm, "").trim().slice(0, 6000);

/** Pulls new inbox mail (primary, not from us, not newsletters) into the CRM. */
export async function syncGmail() {
  const tk = await token().catch(() => null); if (!tk) return { ok: false, reason: "not connected" };
  const { t, g } = tk;
  const after = g.last || Math.floor(Date.now() / 1000) - 86400;
  const list = await api(t, `messages?maxResults=40&q=${encodeURIComponent(`in:inbox category:primary -from:me after:${after}`)}`);
  let added = 0;
  for (const { id } of (list.messages || []) as { id: string }[]) {
    if (!(await firstSeen("gm:" + id))) continue;
    const m = await api(t, `messages/${id}?format=full`);
    const h = (n: string) => (m.payload.headers as { name: string; value: string }[]).find(x => x.name.toLowerCase() === n)?.value || "";
    const from = h("from"), fromEmail = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
    if (!fromEmail || fromEmail === g.email.toLowerCase() || /no-?reply|mailer-daemon|notifications?@|@(shopify|meekitaz)\.com$/i.test(fromEmail) || h("list-unsubscribe")) continue;
    const name = from.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
    await inbound({ channel: "email", thread: m.threadId, name, email: fromEmail, subject: h("subject"), text: fresh(plain(m.payload)) || m.snippet,
      meta: { subject: h("subject"), gmailId: id, messageId: h("message-id") } });
    added++;
  }
  await (await import("./db")).setIntegration("gmail", { ...g, access_token: t, last: Math.floor(Date.now() / 1000) - 120 });
  return { ok: true, added };
}

/** Sends a reply inside the same Gmail thread (appears in the user's Gmail Sent folder). */
export async function gmailReply(o: { to: string; threadId: string; subject: string; text: string; inReplyTo?: string }) {
  const tk = await token(); if (!tk) throw new Error("gmail not connected");
  const subj = /^re:/i.test(o.subject) ? o.subject : `Re: ${o.subject || "Your message"}`;
  const raw = [`From: Meekitaz <${tk.g.email}>`, `To: ${o.to}`, `Subject: ${subj}`, ...(o.inReplyTo ? [`In-Reply-To: ${o.inReplyTo}`, `References: ${o.inReplyTo}`] : []),
    "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", o.text].join("\r\n");
  return api(tk.t, "messages/send", { method: "POST", body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url"), threadId: o.threadId }) });
}
