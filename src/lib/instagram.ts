import { getIntegration, setIntegration, inbound } from "./db";

/* Instagram DMs (Instagram API with Instagram Login): IG_APP_ID / IG_APP_SECRET / IG_VERIFY_TOKEN.
   Messages arrive by webhook; replies go through the Send API (within Instagram's 24-hour window). */
export const igConfigured = () => !!(process.env.IG_APP_ID && process.env.IG_APP_SECRET);
export const igRedirect = (origin: string) => `${origin}/api/crm/instagram/callback`;
type I = { token: string; user_id: string; username: string; exp: number };

export function igAuthUrl(origin: string, state: string) {
  const p = new URLSearchParams({ client_id: process.env.IG_APP_ID!, redirect_uri: igRedirect(origin), response_type: "code", scope: "instagram_business_basic,instagram_business_manage_messages", state, enable_fb_login: "0", force_authentication: "1" });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}
export async function igExchange(origin: string, code: string) {
  const s = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: new URLSearchParams({ client_id: process.env.IG_APP_ID!, client_secret: process.env.IG_APP_SECRET!, grant_type: "authorization_code", redirect_uri: igRedirect(origin), code }) }).then(r => r.json());
  if (!s.access_token) throw new Error(s.error_message || "instagram token");
  const l = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.IG_APP_SECRET}&access_token=${s.access_token}`).then(r => r.json());
  const token = l.access_token || s.access_token;
  const me = await fetch(`https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${token}`).then(r => r.json());
  await fetch(`https://graph.instagram.com/v21.0/${me.user_id || me.id}/subscribed_apps?subscribed_fields=messages&access_token=${token}`, { method: "POST" }).catch(() => null);
  await setIntegration("instagram", { token, user_id: String(me.user_id || me.id), username: me.username, exp: Date.now() + (l.expires_in || 3600) * 1000 });
  return me.username as string;
}
/** Long-lived tokens last 60 days; refresh when under 15 days left (called from the sync cron). */
export async function igRefresh() {
  const i = await getIntegration<I>("instagram"); if (!i || i.exp - Date.now() > 15 * 864e5) return;
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${i.token}`).then(x => x.json()).catch(() => null);
  if (r?.access_token) await setIntegration("instagram", { ...i, token: r.access_token, exp: Date.now() + r.expires_in * 1000 });
}
export async function igHandleWebhook(body: { entry?: { messaging?: { sender: { id: string }; recipient: { id: string }; message?: { mid: string; text?: string; is_echo?: boolean; attachments?: { type: string; payload?: { url?: string } }[] } }[] }[] }) {
  const i = await getIntegration<I>("instagram");
  for (const e of body.entry || []) for (const ev of e.messaging || []) {
    const m = ev.message; if (!m || m.is_echo || ev.sender.id === i?.user_id) continue;
    let name: string | null = null;
    if (i) { const p = await fetch(`https://graph.instagram.com/v21.0/${ev.sender.id}?fields=username,name&access_token=${i.token}`).then(r => r.json()).catch(() => null); name = p?.username ? `@${p.username}` : p?.name || null; }
    const text = m.text || (m.attachments?.length ? `[${m.attachments.map(a => a.type).join(", ")}] ${m.attachments.map(a => a.payload?.url || "").join(" ")}`.trim() : "");
    if (text) await inbound({ channel: "insta", thread: ev.sender.id, name, text, meta: { mid: m.mid } });
  }
}
export async function igSend(recipientId: string, text: string) {
  const i = await getIntegration<I>("instagram"); if (!i) throw new Error("instagram not connected");
  const r = await fetch(`https://graph.instagram.com/v21.0/${i.user_id}/messages`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${i.token}` },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }) });
  if (!r.ok) throw new Error("instagram send " + (await r.text()).slice(0, 200));
}
