import { adminGraphql, adminConfigured } from "./shopifyAdmin";
import { sql, ensureSchema } from "./db";

/* Shopify orders + the production stage we keep for each one (Neon table order_stages). */
export const STAGES = ["new", "cad", "factory", "ready", "shipped", "refund", "upgrade"] as const;
export type Stage = typeof STAGES[number];
export const STAGE_LABEL: Record<Stage, string> = { new: "New order", cad: "3D CAD", factory: "Sent to factory", ready: "Ready", shipped: "Shipped", refund: "Refund request", upgrade: "Upgrade request" };
/** days a piece normally spends in a stage before it's flagged late */
export const STAGE_DAYS: Partial<Record<Stage, number>> = { new: 1, cad: 4, factory: 14, ready: 2 };

export type OrderRow = { id: string; name: string; createdAt: string; total: number; currency: string; customer: string; email: string; financial: string; fulfillment: string;
  items: { title: string; variant: string; qty: number; attrs: { key: string; value: string }[] }[]; note: string | null;
  stage: Stage; stageAt: string; tracking: string | null; carrier: string | null; crmNote: string | null };

type Raw = { orders: { nodes: { id: string; name: string; createdAt: string; note: string | null; email: string | null; displayFinancialStatus: string; displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }; customer: { displayName: string; email: string | null } | null;
  lineItems: { nodes: { title: string; variantTitle: string | null; quantity: number; customAttributes: { key: string; value: string | null }[] }[] } }[] } };

export async function listOrders(query = "created_at:>=-180d"): Promise<OrderRow[]> {
  if (!adminConfigured) return [];
  const d = await adminGraphql<Raw>(`query($q:String!){ orders(first:100, sortKey:CREATED_AT, reverse:true, query:$q){ nodes{ id name createdAt note email displayFinancialStatus displayFulfillmentStatus
    totalPriceSet{ shopMoney{ amount currencyCode } } customer{ displayName email } lineItems(first:20){ nodes{ title variantTitle quantity customAttributes{ key value } } } } } }`, { q: query });
  await ensureSchema();
  const ids = d.orders.nodes.map(o => o.id);
  const st = ids.length ? await sql!`SELECT * FROM order_stages WHERE order_id = ANY(${ids})` : [];
  const by = new Map(st.map(r => [r.order_id as string, r]));
  return d.orders.nodes.map(o => {
    const s = by.get(o.id);
    const fulfilled = o.displayFulfillmentStatus === "FULFILLED";
    return { id: o.id, name: o.name, createdAt: o.createdAt, total: Number(o.totalPriceSet.shopMoney.amount), currency: o.totalPriceSet.shopMoney.currencyCode,
      customer: o.customer?.displayName || o.email || "Customer", email: o.customer?.email || o.email || "", financial: o.displayFinancialStatus, fulfillment: o.displayFulfillmentStatus,
      items: o.lineItems.nodes.map(l => ({ title: l.title, variant: l.variantTitle && l.variantTitle !== "Default Title" ? l.variantTitle : "", qty: l.quantity, attrs: l.customAttributes.filter(a => a.value && !a.key.startsWith("_")).map(a => ({ key: a.key, value: a.value! })) })),
      note: o.note, stage: (s?.stage as Stage) || (fulfilled ? "shipped" : "new"), stageAt: (s?.stage_at as string) || o.createdAt,
      tracking: (s?.tracking as string) || null, carrier: (s?.carrier as string) || null, crmNote: (s?.note as string) || null };
  });
}

export async function setStage(o: { id: string; name: string; stage: Stage; tracking?: string; carrier?: string; note?: string }) {
  await ensureSchema();
  await sql!`INSERT INTO order_stages (order_id, name, stage, tracking, carrier, note) VALUES (${o.id}, ${o.name}, ${o.stage}, ${o.tracking || null}, ${o.carrier || null}, ${o.note || null})
    ON CONFLICT (order_id) DO UPDATE SET stage=EXCLUDED.stage, name=EXCLUDED.name,
      stage_at = CASE WHEN order_stages.stage = EXCLUDED.stage THEN order_stages.stage_at ELSE now() END,
      tracking=COALESCE(EXCLUDED.tracking, order_stages.tracking), carrier=COALESCE(EXCLUDED.carrier, order_stages.carrier), note=COALESCE(EXCLUDED.note, order_stages.note), updated_at=now()`;
}

/** For Mia: status of an order, only when the email matches the order. */
export async function orderStatusFor(orderNumber: string, email: string) {
  const num = orderNumber.replace(/[^0-9]/g, ""); if (!num) return null;
  const rows = await listOrders(`name:#${num}`);
  const o = rows.find(r => r.name.replace(/[^0-9]/g, "") === num);
  if (!o || !email || o.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  return o;
}
