import { NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await crmAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!dbConfigured) return NextResponse.json({ items: [] });
  await ensureSchema();
  const items = await sql!`SELECT id, order_id, order_name, conversation_id, who, text, to_char(due,'YYYY-MM-DD') AS due, done FROM reminders
    WHERE NOT done OR due >= current_date - 1 ORDER BY done, due, id LIMIT 300`;
  return NextResponse.json({ items });
}
