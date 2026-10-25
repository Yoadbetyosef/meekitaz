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
  const prev = (await sql!`SELECT stage FROM order_stages WHERE order_id=${o.id}`)[0]?.stage;
  if (prev !== o.stage) await sql!`INSERT INTO order_events (order_id, kind, text, author) VALUES (${o.id}, 'system', ${`Moved to ${STAGE_LABEL[o.stage]}${o.tracking ? ` · ${o.carrier || ''} ${o.tracking}` : ''}`}, ${null})`;
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

/* ---------- Full order page ---------- */
export type OrderFull = OrderRow & {
  phone: string | null; processedAt: string; tags: string[]; gateways: string[];
  money: { subtotal: number; discounts: number; shipping: number; tax: number; total: number; received: number; codes: string[] };
  ship: { name: string; lines: string[]; phone: string | null; method: string | null } | null;
  lines: { title: string; variant: string; sku: string | null; qty: number; image: string | null; price: number; total: number; attrs: { key: string; value: string }[] }[];
  events: { id: number; kind: string; text: string; author: string | null; created_at: string }[];
  reminders: { id: number; text: string; due: string; done: boolean; who: string | null }[];
  history: { id: string; channel: string; summary: string; updated_at: string; lead: Record<string, string> }[];
  herDate: string | null;
};
const money = (m?: { shopMoney: { amount: string } } | null) => Number(m?.shopMoney.amount || 0);

export async function getOrder(id: string): Promise<OrderFull | null> {
  type R = { order: null | { id: string; name: string; createdAt: string; processedAt: string; note: string | null; email: string | null; phone: string | null; tags: string[]; paymentGatewayNames: string[];
    displayFinancialStatus: string; displayFulfillmentStatus: string; discountCodes: string[];
    subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } }; totalDiscountsSet: { shopMoney: { amount: string } }; totalShippingPriceSet: { shopMoney: { amount: string } };
    totalTaxSet: { shopMoney: { amount: string } }; totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }; totalReceivedSet: { shopMoney: { amount: string } };
    customer: { displayName: string; email: string | null; phone: string | null } | null;
    shippingAddress: { name: string | null; formattedArea: string | null; address1: string | null; address2: string | null; city: string | null; provinceCode: string | null; zip: string | null; country: string | null; phone: string | null } | null;
    shippingLine: { title: string } | null;
    lineItems: { nodes: { title: string; variantTitle: string | null; sku: string | null; quantity: number; image: { url: string } | null; originalUnitPriceSet: { shopMoney: { amount: string } }; discountedTotalSet: { shopMoney: { amount: string } }; customAttributes: { key: string; value: string | null }[] }[] } } };
  const d = await adminGraphql<R>(`query($id:ID!){ order(id:$id){ id name createdAt processedAt note email phone tags paymentGatewayNames displayFinancialStatus displayFulfillmentStatus discountCodes
    subtotalPriceSet{ shopMoney{ amount currencyCode } } totalDiscountsSet{ shopMoney{ amount } } totalShippingPriceSet{ shopMoney{ amount } } totalTaxSet{ shopMoney{ amount } }
    totalPriceSet{ shopMoney{ amount currencyCode } } totalReceivedSet{ shopMoney{ amount } }
    customer{ displayName email phone } shippingAddress{ name address1 address2 city provinceCode zip country phone } shippingLine{ title }
    lineItems(first:50){ nodes{ title variantTitle sku quantity image{ url } originalUnitPriceSet{ shopMoney{ amount } } discountedTotalSet{ shopMoney{ amount } } customAttributes{ key value } } } } }`, { id });
  const o = d.order; if (!o) return null;
  await ensureSchema();
  const st = (await sql!`SELECT * FROM order_stages WHERE order_id=${id}`)[0];
  const email = (o.customer?.email || o.email || "").toLowerCase();
  const events = await sql!`SELECT id, kind, text, author, created_at FROM order_events WHERE order_id=${id} ORDER BY id DESC`;
  const reminders = await sql!`SELECT id, text, to_char(due,'YYYY-MM-DD') AS due, done, who FROM reminders WHERE order_id=${id} ORDER BY done, due`;
  const history = email ? await sql!`SELECT id, channel, COALESCE(summary, lead->>'interest', '') AS summary, updated_at, lead FROM conversations WHERE lower(email)=${email} ORDER BY updated_at DESC LIMIT 20` : [];
  const herDate = (history as { lead: Record<string, string> }[]).map(h => h.lead?.timeline).find(Boolean) || null;
  const a = o.shippingAddress;
  const fulfilled = o.displayFulfillmentStatus === "FULFILLED";
  const lines = o.lineItems.nodes.map(l => ({ title: l.title, variant: l.variantTitle && l.variantTitle !== "Default Title" ? l.variantTitle : "", sku: l.sku, qty: l.quantity, image: l.image?.url || null,
    price: money(l.originalUnitPriceSet), total: money(l.discountedTotalSet), attrs: l.customAttributes.filter(x => x.value && !x.key.startsWith("_")).map(x => ({ key: x.key, value: x.value! })) }));
  return {
    id: o.id, name: o.name, createdAt: o.createdAt, processedAt: o.processedAt, total: money(o.totalPriceSet), currency: o.totalPriceSet.shopMoney.currencyCode,
    customer: o.customer?.displayName || o.email || "Customer", email: o.customer?.email || o.email || "", phone: o.customer?.phone || o.phone || a?.phone || null,
    financial: o.displayFinancialStatus, fulfillment: o.displayFulfillmentStatus, tags: o.tags, gateways: o.paymentGatewayNames,
    items: lines.map(l => ({ title: l.title, variant: l.variant, qty: l.qty, attrs: l.attrs })), lines, note: o.note,
    stage: (st?.stage as Stage) || (fulfilled ? "shipped" : "new"), stageAt: (st?.stage_at as string) || o.createdAt, tracking: (st?.tracking as string) || null, carrier: (st?.carrier as string) || null, crmNote: (st?.note as string) || null,
    money: { subtotal: money(o.subtotalPriceSet), discounts: money(o.totalDiscountsSet), shipping: money(o.totalShippingPriceSet), tax: money(o.totalTaxSet), total: money(o.totalPriceSet), received: money(o.totalReceivedSet), codes: o.discountCodes },
    ship: a ? { name: a.name || "", lines: [a.address1, a.address2, [a.city, a.provinceCode, a.zip].filter(Boolean).join(", "), a.country].filter(Boolean) as string[], phone: a.phone, method: o.shippingLine?.title || null } : null,
    events: events as OrderFull["events"], reminders: reminders as OrderFull["reminders"], history: history as OrderFull["history"], herDate,
  };
}

export async function addEvent(orderId: string, kind: string, text: string, author = "Team") {
  await ensureSchema();
  await sql!`INSERT INTO order_events (order_id, kind, text, author) VALUES (${orderId}, ${kind}, ${text}, ${author})`;
}
