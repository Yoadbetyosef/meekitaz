import { createHash } from "crypto";
import { cookies } from "next/headers";

/* CRM login: one password (CRM_PASSWORD in Vercel). The cookie holds a hash of it, so changing the password logs everyone out. */
export const CRM_COOKIE = "mk_crm";
export const crmToken = () => process.env.CRM_PASSWORD ? createHash("sha256").update("meekitaz-crm:" + process.env.CRM_PASSWORD).digest("hex") : "";
export async function crmAuthed() { const t = crmToken(); if (!t) return false; const c = (await cookies()).get(CRM_COOKIE)?.value; return c === t; }
