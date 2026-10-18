import { karatStep } from "./karat";
// Server-only. Creates the product for a chosen diamond (diamonds come from our supplier, not from Shopify) and a cart holding ring + diamond.
const domain = process.env.SHOPIFY_STORE_DOMAIN, sfToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
// Admin access: either a fixed token (SHOPIFY_ADMIN_TOKEN, from a legacy custom app) or the Client ID + Client secret of a Dev Dashboard app, which are exchanged for a token that lasts 24 hours.
const staticToken = process.env.SHOPIFY_ADMIN_TOKEN, clientId = process.env.SHOPIFY_CLIENT_ID, clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const adminBase = process.env.SHOPIFY_ADMIN_API_BASE || `https://${domain}`;
const sfBase = process.env.SHOPIFY_API_BASE || `https://${domain}`;
export const adminConfigured = Boolean(domain && sfToken && (staticToken || (clientId && clientSecret)));

let cached: { token: string; exp: number } | null = null;
let inflight: Promise<string> | null = null;
async function adminToken(force = false): Promise<string> {
  if (staticToken) return staticToken;
  if (!force && cached && cached.exp - Date.now() > 5 * 60_000) return cached.token; // refreshed five minutes before it expires
  if (!inflight) inflight = (async () => {
    const r = await fetch(`${adminBase}/admin/oauth/access_token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId!, client_secret: clientSecret! }), cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error("admin token: " + (j.error_description || j.error || r.status));
    cached = { token: j.access_token as string, exp: Date.now() + (Number(j.expires_in) || 86399) * 1000 };
    return cached.token;
  })().finally(() => { inflight = null; });
  return inflight;
}

async function admin<T>(query: string, variables: Record<string, unknown> = {}, retry = true): Promise<T> {
  const r = await fetch(`${adminBase}/admin/api/2025-07/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await adminToken() }, body: JSON.stringify({ query, variables }), cache: "no-store" });
  if (r.status === 401 && retry && !staticToken) { cached = null; await adminToken(true); return admin<T>(query, variables, false); } // the token was revoked or rotated: get a new one once
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error("admin: " + JSON.stringify(j.errors || r.status).slice(0, 300));
  return j.data as T;
}
async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${sfBase}/api/2025-07/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": sfToken! }, body: JSON.stringify({ query, variables }), cache: "no-store" });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error("storefront: " + JSON.stringify(j.errors || r.status).slice(0, 300));
  return j.data as T;
}

export type StoneInfo = { vendor: number; stock: string; title: string; price: number; html: string; sku: string };
export const stoneHandle = (vendor: number, stock: string) => `diamond-${vendor}-${stock}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

let pubId: string | null = process.env.SHOPIFY_HEADLESS_PUBLICATION_ID || null;
async function headlessPublication(): Promise<string> {
  if (pubId) return pubId;
  const d = await admin<{ publications: { nodes: { id: string; name: string }[] } }>(`{ publications(first: 20) { nodes { id name } } }`);
  const hit = d.publications.nodes.find(p => /headless|meekitaz/i.test(p.name));
  if (!hit) throw new Error("no Headless publication found");
  return (pubId = hit.id);
}

/** The Shopify variant for this diamond: reused when it already exists, created (and published to the site) when it does not. */
export async function ensureStoneVariant(s: StoneInfo): Promise<string> {
  const handle = stoneHandle(s.vendor, s.stock);
  const have = await storefront<{ product: { variants: { edges: { node: { id: string; price: { amount: string } } }[] } } | null }>(
    `query($h:String!){ product(handle:$h){ variants(first:1){ edges{ node{ id price{ amount } } } } } }`, { h: handle });
  const v = have.product?.variants.edges[0]?.node;
  if (v && Math.abs(+v.price.amount - s.price) < 0.5) return v.id;

  // a product exists but at an old price, or not at all
  const found = await admin<{ productByHandle: { id: string; variants: { nodes: { id: string }[] } } | null }>(`query($h:String!){ productByHandle(handle:$h){ id variants(first:1){ nodes{ id } } } }`, { h: handle });
  let productId = found.productByHandle?.id, variantId = found.productByHandle?.variants.nodes[0]?.id;
  if (!productId) {
    const c = await admin<{ productCreate: { product: { id: string; variants: { nodes: { id: string }[] } } | null; userErrors: { message: string }[] } }>(
      `mutation($product: ProductCreateInput!){ productCreate(product: $product){ product{ id variants(first:1){ nodes{ id } } } userErrors{ field message } } }`,
      { product: { title: s.title, handle, status: "ACTIVE", vendor: "Meekitaz", productType: "Diamond", tags: ["Diamond", "Built ring"], descriptionHtml: s.html } });
    if (c.productCreate.userErrors.length || !c.productCreate.product) throw new Error("productCreate: " + JSON.stringify(c.productCreate.userErrors));
    productId = c.productCreate.product.id; variantId = c.productCreate.product.variants.nodes[0]?.id;
    const p = await admin<{ publishablePublish: { userErrors: { message: string }[] } }>(`mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id,input:$input){ userErrors{ field message } } }`, { id: productId, input: [{ publicationId: await headlessPublication() }] });
    if (p.publishablePublish.userErrors.length) throw new Error("publish: " + JSON.stringify(p.publishablePublish.userErrors));
  }
  if (!productId || !variantId) throw new Error("no variant");
  const u = await admin<{ productVariantsBulkUpdate: { userErrors: { message: string }[] } }>(
    `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$productId,variants:$variants){ productVariants{ id price } userErrors{ field message } } }`,
    { productId, variants: [{ id: variantId, price: s.price.toFixed(2), inventoryItem: { sku: s.sku, tracked: false } }] });
  if (u.productVariantsBulkUpdate.userErrors.length) throw new Error("price: " + JSON.stringify(u.productVariantsBulkUpdate.userErrors));
  // the Storefront API can take a moment to see a new or re-priced product
  for (let i = 0; i < 8; i++) {
    const chk = await storefront<{ product: { variants: { edges: { node: { id: string; price: { amount: string } } }[] } } | null }>(`query($h:String!){ product(handle:$h){ variants(first:1){ edges{ node{ id price{ amount } } } } } }`, { h: handle });
    const n = chk.product?.variants.edges[0]?.node;
    if (n && Math.abs(+n.price.amount - s.price) < 0.5) return n.id;
    await new Promise(r => setTimeout(r, 700));
  }
  return variantId;
}

/** One cart with the ring and its diamond, the ring size on both lines, and a checkout link. */
export async function createRingCart(settingVariantId: string, stoneVariantId: string, size: string, stoneNote: string): Promise<string> {
  const d = await storefront<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } }>(
    `mutation($input: CartInput!){ cartCreate(input:$input){ cart{ checkoutUrl } userErrors{ field message } } }`,
    { input: { lines: [
      { merchandiseId: settingVariantId, quantity: 1, attributes: [{ key: "Ring size", value: size }, { key: "Diamond", value: stoneNote }] },
      { merchandiseId: stoneVariantId, quantity: 1, attributes: [{ key: "Ring size", value: size }, { key: "For setting", value: "Built ring" }] },
    ], attributes: [{ key: "Ring size", value: size }] } });
  if (d.cartCreate.userErrors.length || !d.cartCreate.cart) throw new Error("cart: " + JSON.stringify(d.cartCreate.userErrors));
  return d.cartCreate.cart.checkoutUrl;
}

/**
 * The Shopify variant for a design at 14K or 18K. Listed prices are the 10K prices, so 10K is the product itself; 14K and 18K are the same design
 * with the price step from our price list, created (and published to the site) the first time somebody buys it and reused after that.
 */
export async function ensureKaratVariant(variantId: string, karat: string): Promise<string> {
  if (!karat || karat === "10K") return variantId;
  if (karat !== "14K" && karat !== "18K") throw new Error("unknown karat");
  const q = await storefront<{ node: { price: { amount: string }; compareAtPrice: { amount: string } | null; product: { handle: string; title: string; productType: string; descriptionHtml: string; tags: string[]; images: { edges: { node: { url: string } }[] } } } | null }>(
    `query($id:ID!){ node(id:$id){ ... on ProductVariant { price{ amount } compareAtPrice{ amount } product{ handle title productType descriptionHtml tags images(first:3){ edges{ node{ url } } } } } } }`, { id: variantId });
  const v = q.node; if (!v) throw new Error("setting variant not found");
  const ns = v.product.tags.find(t => /^NS-\d+$/.test(t)) || "";
  const step = karatStep(ns, karat); if (!step) throw new Error(`${karat} is not offered for ${ns || "this design"}`);
  const price = +v.price.amount + step, compare = v.compareAtPrice ? +v.compareAtPrice.amount + 2 * step : 0;
  const handle = `${v.product.handle}-${karat.toLowerCase()}`.slice(0, 250);
  const lookup = () => storefront<{ product: { variants: { edges: { node: { id: string; price: { amount: string } } }[] } } | null }>(`query($h:String!){ product(handle:$h){ variants(first:1){ edges{ node{ id price{ amount } } } } } }`, { h: handle });
  const have = (await lookup()).product?.variants.edges[0]?.node;
  if (have && Math.abs(+have.price.amount - price) < 0.5) return have.id;

  const found = await admin<{ productByHandle: { id: string; variants: { nodes: { id: string }[] } } | null }>(`query($h:String!){ productByHandle(handle:$h){ id variants(first:1){ nodes{ id } } } }`, { h: handle });
  let productId = found.productByHandle?.id, variantGid = found.productByHandle?.variants.nodes[0]?.id;
  if (!productId) {
    const input = { title: `${v.product.title} (${karat})`, handle, status: "ACTIVE", vendor: "Meekitaz", productType: v.product.productType || "Ring", tags: ["Karat variant", karat, ...v.product.tags.filter(t => /^NS-\d+$/.test(t))], descriptionHtml: v.product.descriptionHtml };
    const create = (media: { originalSource: string; mediaContentType: "IMAGE" }[]) => admin<{ productCreate: { product: { id: string; variants: { nodes: { id: string }[] } } | null; userErrors: { message: string }[] } }>(
      `mutation($product: ProductCreateInput!, $media: [CreateMediaInput!]){ productCreate(product: $product, media: $media){ product{ id variants(first:1){ nodes{ id } } } userErrors{ field message } } }`, { product: input, media });
    const images = v.product.images.edges.slice(0, 1).map(e => ({ originalSource: e.node.url, mediaContentType: "IMAGE" as const }));
    let c = await create(images);
    if ((c.productCreate.userErrors.length || !c.productCreate.product) && images.length) c = await create([]); // never lose a sale over a picture
    if (c.productCreate.userErrors.length || !c.productCreate.product) throw new Error("productCreate: " + JSON.stringify(c.productCreate.userErrors));
    productId = c.productCreate.product.id; variantGid = c.productCreate.product.variants.nodes[0]?.id;
    const p = await admin<{ publishablePublish: { userErrors: { message: string }[] } }>(`mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id,input:$input){ userErrors{ field message } } }`, { id: productId, input: [{ publicationId: await headlessPublication() }] });
    if (p.publishablePublish.userErrors.length) throw new Error("publish: " + JSON.stringify(p.publishablePublish.userErrors));
  }
  if (!productId || !variantGid) throw new Error("no variant");
  const u = await admin<{ productVariantsBulkUpdate: { userErrors: { message: string }[] } }>(
    `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$productId,variants:$variants){ productVariants{ id price } userErrors{ field message } } }`,
    { productId, variants: [{ id: variantGid, price: price.toFixed(2), compareAtPrice: compare ? compare.toFixed(2) : null, inventoryItem: { tracked: false } }] });
  if (u.productVariantsBulkUpdate.userErrors.length) throw new Error("price: " + JSON.stringify(u.productVariantsBulkUpdate.userErrors));
  for (let i = 0; i < 8; i++) { // the Storefront API can take a moment to see a new or re-priced product
    const n = (await lookup()).product?.variants.edges[0]?.node;
    if (n && Math.abs(+n.price.amount - price) < 0.5) return n.id;
    await new Promise(r => setTimeout(r, 700));
  }
  return variantGid;
}
