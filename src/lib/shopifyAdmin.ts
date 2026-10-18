// Server-only. Creates the product for a chosen diamond (diamonds come from our supplier, not from Shopify) and a cart holding ring + diamond.
const domain = process.env.SHOPIFY_STORE_DOMAIN, adminToken = process.env.SHOPIFY_ADMIN_TOKEN, sfToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
const adminBase = process.env.SHOPIFY_ADMIN_API_BASE || `https://${domain}`;
const sfBase = process.env.SHOPIFY_API_BASE || `https://${domain}`;
export const adminConfigured = Boolean(domain && adminToken && sfToken);

async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${adminBase}/admin/api/2025-07/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken! }, body: JSON.stringify({ query, variables }), cache: "no-store" });
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
