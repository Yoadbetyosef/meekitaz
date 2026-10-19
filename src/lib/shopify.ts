// Shopify Storefront API client (server only).
import { fancyColorOf } from "./fancy";
// Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in .env.local / Vercel.
export type Product = { id: string; handle: string; title: string; price: string; currency: string; compareAt?: number; image?: { url: string; alt: string } };

export type CartLine = {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  handle: string;
  price: number;      // per unit
  attributes: { key: string; value: string }[];
  compareAt: number;  // per unit, 0 when there is no compare-at price
  image?: { url: string; alt: string };
};
export type Cart = { id: string; checkoutUrl: string; totalQuantity: number; subtotal: number; savings: number; currency: string; lines: CartLine[] };

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
export const shopifyConfigured = Boolean(domain && token);

async function sf<T>(query: string, variables: Record<string, unknown> = {}, opts: { fresh?: boolean } = {}): Promise<T | null> {
  if (!shopifyConfigured) return null;
  const r = await fetch(`${process.env.SHOPIFY_API_BASE || `https://${domain}`}/api/2025-07/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token! },
    body: JSON.stringify({ query, variables }),
    ...(opts.fresh ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (j.errors) { console.error("[shopify]", JSON.stringify(j.errors)); return null; }
  return j.data as T;
}

/** Products from a Shopify collection whose handle matches the category slug (e.g. "engagement-rings"). */
export async function getCollectionProducts(handle: string, first = 12): Promise<Product[] | null> {
  const data = await sf<{ collection: { products: { edges: { node: { id: string; handle: string; title: string; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; featuredImage?: { url: string; altText?: string } } }[] } } | null }>(
    `query($handle:String!,$first:Int!){ collection(handle:$handle){ products(first:$first){ edges{ node{ id handle title priceRange{ minVariantPrice{ amount currencyCode } } featuredImage{ url altText } } } } } }`,
    { handle, first }
  );
  const edges = data?.collection?.products?.edges;
  if (!edges) return null;
  return edges.map(({ node }) => ({ id: node.id, handle: node.handle, title: node.title, price: node.priceRange.minVariantPrice.amount, currency: node.priceRange.minVariantPrice.currencyCode, image: node.featuredImage ? { url: node.featuredImage.url, alt: node.featuredImage.altText || node.title } : undefined }));
}

/* ---------------- Cart ---------------- */
const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) { edges { node {
    id quantity attributes { key value }
    merchandise { ... on ProductVariant {
      title price { amount } compareAtPrice { amount }
      image { url altText }
      product { title handle featuredImage { url altText } }
    } }
  } } }`;

type RawCart = {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: { edges: { node: { id: string; quantity: number; attributes?: { key: string; value: string }[]; merchandise: {
    title: string; price: { amount: string }; compareAtPrice?: { amount: string } | null;
    image?: { url: string; altText?: string } | null;
    product: { title: string; handle: string; featuredImage?: { url: string; altText?: string } | null };
  } } }[] };
};

function shapeCart(c: RawCart): Cart {
  const lines: CartLine[] = c.lines.edges.map(({ node }) => {
    const m = node.merchandise; const img = m.image || m.product.featuredImage;
    const price = +m.price.amount; const cmp = m.compareAtPrice ? +m.compareAtPrice.amount : 0;
    return {
      id: node.id, quantity: node.quantity, title: m.product.title, attributes: node.attributes || [],
      variantTitle: m.title === "Default Title" ? "" : m.title, handle: m.product.handle,
      price, compareAt: cmp > price ? cmp : 0,
      image: img ? { url: img.url, alt: img.altText || m.product.title } : undefined,
    };
  });
  return {
    id: c.id, checkoutUrl: c.checkoutUrl, totalQuantity: c.totalQuantity,
    subtotal: +c.cost.subtotalAmount.amount, currency: c.cost.subtotalAmount.currencyCode,
    savings: lines.reduce((a, l) => a + (l.compareAt ? (l.compareAt - l.price) * l.quantity : 0), 0),
    lines,
  };
}

type CartPayload = { cart: RawCart | null; userErrors?: { message: string }[] };

export async function getCart(id: string): Promise<Cart | null> {
  const d = await sf<{ cart: RawCart | null }>(`query($id:ID!){ cart(id:$id){ ${CART_FIELDS} } }`, { id }, { fresh: true });
  return d?.cart ? shapeCart(d.cart) : null;
}
export async function createCart(variantId: string, quantity = 1): Promise<Cart | null> {
  const d = await sf<{ cartCreate: CartPayload }>(
    `mutation($lines:[CartLineInput!]!){ cartCreate(input:{lines:$lines}){ cart{ ${CART_FIELDS} } userErrors{ message } } }`,
    { lines: [{ merchandiseId: variantId, quantity }] }, { fresh: true });
  return d?.cartCreate.cart ? shapeCart(d.cartCreate.cart) : null;
}
export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart | null> {
  const d = await sf<{ cartLinesAdd: CartPayload }>(
    `mutation($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId,lines:$lines){ cart{ ${CART_FIELDS} } userErrors{ message } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] }, { fresh: true });
  return d?.cartLinesAdd.cart ? shapeCart(d.cartLinesAdd.cart) : null;
}
export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart | null> {
  const d = await sf<{ cartLinesUpdate: CartPayload }>(
    `mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){ cartLinesUpdate(cartId:$cartId,lines:$lines){ cart{ ${CART_FIELDS} } userErrors{ message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] }, { fresh: true });
  return d?.cartLinesUpdate.cart ? shapeCart(d.cartLinesUpdate.cart) : null;
}
export async function removeCartLine(cartId: string, lineId: string): Promise<Cart | null> {
  const d = await sf<{ cartLinesRemove: CartPayload }>(
    `mutation($cartId:ID!,$lineIds:[ID!]!){ cartLinesRemove(cartId:$cartId,lineIds:$lineIds){ cart{ ${CART_FIELDS} } userErrors{ message } } }`,
    { cartId, lineIds: [lineId] }, { fresh: true });
  return d?.cartLinesRemove.cart ? shapeCart(d.cartLinesRemove.cart) : null;
}

/* ---------------- Product page ---------------- */
export type ProductVariant = { id: string; title: string; available: boolean; price: number; compareAt: number; selected: { name: string; value: string }[]; imageUrl?: string };
export type ProductFull = {
  id: string; handle: string; title: string; description: string; descriptionHtml: string; productType: string; tags: string[];
  options: { name: string; values: string[] }[]; images: { url: string; alt: string; width: number; height: number }[]; variants: ProductVariant[]; currency: string; seoTitle?: string; seoDescription?: string;
};
export type Sibling = { handle: string; title: string; metal: string; image?: string };
export type Related = { handle: string; title: string; price: number; compareAt: number; image?: string };

export const METALS = ["Rose Gold", "Yellow Gold", "White Gold", "Platinum", "Silver"];
export const metalOf = (tags: string[]) => METALS.find(m => tags.some(t => t.toLowerCase() === m.toLowerCase())) || "";
export const designCode = (tags: string[]) => tags.find(t => /^NS-\d+$/i.test(t)) || "";

export async function getProductByHandle(handle: string): Promise<ProductFull | null> {
  const d = await sf<{ product: null | { id: string; handle: string; title: string; description: string; descriptionHtml: string; productType: string; tags: string[];
    seo: { title?: string; description?: string }; options: { name: string; values: string[] }[];
    images: { edges: { node: { url: string; altText?: string; width: number; height: number } }[] };
    variants: { edges: { node: { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; compareAtPrice?: { amount: string } | null; selectedOptions: { name: string; value: string }[]; image?: { url: string } | null } }[] } } }>(
    `query($handle:String!){ product(handle:$handle){ id handle title description descriptionHtml productType tags seo{ title description } options{ name values }
      images(first:20){ edges{ node{ url altText width height } } }
      variants(first:60){ edges{ node{ id title availableForSale price{ amount currencyCode } compareAtPrice{ amount } selectedOptions{ name value } image{ url } } } } } }`, { handle });
  const p = d?.product; if (!p) return null;
  const vs = p.variants.edges.map(({ node: v }) => ({ id: v.id, title: v.title, available: v.availableForSale, price: +v.price.amount, compareAt: v.compareAtPrice && +v.compareAtPrice.amount > +v.price.amount ? +v.compareAtPrice.amount : 0, selected: v.selectedOptions, imageUrl: v.image?.url }));
  return {
    id: p.id, handle: p.handle, title: p.title, description: p.description, descriptionHtml: p.descriptionHtml, productType: p.productType, tags: p.tags,
    options: p.options, images: p.images.edges.map(({ node: i }) => ({ url: i.url, alt: i.altText || p.title, width: i.width, height: i.height })), variants: vs,
    currency: p.variants.edges[0]?.node.price.currencyCode || "USD", seoTitle: p.seo?.title || undefined, seoDescription: p.seo?.description || undefined,
  };
}

/** The same design in other metals (Shopify holds each metal as its own product, linked by the NS design code tag). */
export async function getSiblings(code: string, exceptHandle: string): Promise<Sibling[]> {
  if (!code) return [];
  const d = await sf<{ products: { edges: { node: { handle: string; title: string; tags: string[]; featuredImage?: { url: string } | null } }[] } }>(
    `query($q:String!){ products(first:40, query:$q){ edges{ node{ handle title tags featuredImage{ url } } } } }`, { q: `tag:${code}` });
  // metal from the tag when it is a full name, otherwise from the title ("White gold …", "Platinum …"), so no metal of the design is dropped;
  // configured / karat / stone products created at checkout are not siblings
  const seen = new Set<string>();
  return (d?.products.edges || []).filter(({ node }) => !node.tags.some(t => ["Configured", "Karat variant", "Diamond"].includes(t)))
    .map(({ node }) => ({ handle: node.handle, title: node.title, metal: metalOf(node.tags) || ringMetalOf(node.title), image: node.featuredImage?.url }))
    .filter(x => { if (!x.metal && x.handle !== exceptHandle) return false; const k = x.metal || x.handle; if (seen.has(k) && x.handle !== exceptHandle) return false; seen.add(k); return true; });
}

export async function getRelated(productType: string, exceptHandle: string, first = 4): Promise<Related[]> {
  if (!productType) return [];
  const d = await sf<{ products: { edges: { node: { handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string } | null } }[] } }>(
    `query($q:String!,$n:Int!){ products(first:$n, query:$q, sortKey:BEST_SELLING){ edges{ node{ handle title tags priceRange{ minVariantPrice{ amount } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url } } } } }`,
    { q: `product_type:"${productType.replace(/"/g, "")}"`, n: first + 6 });
  return (d?.products.edges || []).map(e => e.node).filter(n => n.handle !== exceptHandle && !n.tags.some(t => t.toLowerCase() === "fifa world cup 2026"))
    .slice(0, first).map(n => ({ handle: n.handle, title: n.title, price: +n.priceRange.minVariantPrice.amount, compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0, image: n.featuredImage?.url }));
}

/* ---------------- Category listing with paging and sorting ---------------- */
export const SORTS: Record<string, { key: string; reverse: boolean }> = {
  best: { key: "BEST_SELLING", reverse: false }, new: { key: "CREATED", reverse: true },
  price_asc: { key: "PRICE", reverse: false }, price_desc: { key: "PRICE", reverse: true },
};
export async function getCollectionPage(handle: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const so = SORTS[opts.sort || "best"] || SORTS.best;
  const d = await sf<{ collection: null | { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string; altText?: string } | null } }[] } } }>(
    `query($handle:String!,$first:Int!,$after:String,$key:ProductCollectionSortKeys!,$rev:Boolean!){ collection(handle:$handle){ products(first:$first, after:$after, sortKey:$key, reverse:$rev){
      pageInfo{ hasNextPage endCursor }
      edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount currencyCode } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url altText } } } } } }`,
    { handle, first: opts.first || 24, after: opts.after || null, key: so.key, rev: so.reverse });
  const c = d?.collection?.products; if (!c) return null;
  const products = c.edges.map(e => e.node).filter(n => !n.tags.some(t => t.toLowerCase() === "fifa world cup 2026")).map(n => ({
    id: n.id, handle: n.handle, title: n.title, price: n.priceRange.minVariantPrice.amount, currency: n.priceRange.minVariantPrice.currencyCode,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    image: n.featuredImage ? { url: n.featuredImage.url, alt: n.featuredImage.altText || n.title } : undefined,
  }));
  return { products, hasNext: c.pageInfo.hasNextPage, cursor: c.pageInfo.endCursor };
}

/** Cards for a Shopify product search (used by the filtered category pages). */
const PSORT: Record<string, { key: string; rev: boolean }> = { best: { key: "BEST_SELLING", rev: false }, new: { key: "CREATED_AT", rev: true }, price_asc: { key: "PRICE", rev: false }, price_desc: { key: "PRICE", rev: true } };
export async function getProductsByQuery(query: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const so = PSORT[opts.sort || "best"] || PSORT.best;
  const d = await sf<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string; altText?: string } | null } }[] } }>(
    `query($q:String!,$first:Int!,$after:String,$key:ProductSortKeys,$rev:Boolean){ products(first:$first, after:$after, query:$q, sortKey:$key, reverse:$rev){
      pageInfo{ hasNextPage endCursor }
      edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount currencyCode } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url altText } } } } }`,
    { q: query, first: opts.first || 24, after: opts.after || null, key: so.key, rev: so.rev });
  const c = d?.products; if (!c) return null;
  const products = c.edges.map(e => e.node).filter(n => !n.tags.some(t => t.toLowerCase() === "fifa world cup 2026")).map(n => ({
    id: n.id, handle: n.handle, title: n.title, price: n.priceRange.minVariantPrice.amount, currency: n.priceRange.minVariantPrice.currencyCode,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    image: n.featuredImage ? { url: n.featuredImage.url, alt: n.featuredImage.altText || n.title } : undefined,
  }));
  return { products, hasNext: c.pageInfo.hasNextPage, cursor: c.pageInfo.endCursor };
}

/* ---------------- Engagement-ring settings: one design in every shape and metal ---------------- */
export type RingVariant = { id: string; handle: string; title: string; shape: string; metal: string; price: number; compareAt: number; images: string[]; variantId: string };
const SHAPE_NAMES = ["Round", "Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Asscher", "Heart"];
const METAL_RE = /(Rose gold|Yellow gold|White gold|Platinum|Silver)/i;
export const ringMetalOf = (title: string) => { const m = title.match(METAL_RE); if (!m) return ""; const t = m[1].toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
export const ringShapeOf = (tags: string[], title: string) => SHAPE_NAMES.find(n => tags.includes(n)) || SHAPE_NAMES.find(n => new RegExp(`\\b${n}\\b`, "i").test(title)) || "";
/** One design in every shape and metal. A design exists in white and in fancy colours under the same code, so the family is for one colour ("" = white). */
export async function getRingFamily(code: string, color = ""): Promise<RingVariant[]> {
  if (!code) return [];
  const d = await sf<{ products: { edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; images: { edges: { node: { url: string } }[] }; variants: { edges: { node: { id: string } }[] } } }[] } }>(
    `query($q:String!){ products(first:250, query:$q){ edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount } } compareAtPriceRange{ minVariantPrice{ amount } } images(first:4){ edges{ node{ url } } } variants(first:1){ edges{ node{ id } } } } } } }`, { q: color ? `tag:${code} AND title:'Fancy ${color}'` : `tag:${code}` });
  return (d?.products.edges || []).map(e => e.node).filter(n => n.tags.includes("Engagement Ring") && n.tags.includes(code) && fancyColorOf(n.title) === color).map(n => ({
    id: n.id, handle: n.handle, title: n.title, shape: ringShapeOf(n.tags, n.title), metal: ringMetalOf(n.title), price: +n.priceRange.minVariantPrice.amount,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    images: n.images.edges.map(i => i.node.url), variantId: n.variants.edges[0]?.node.id || "",
  })).filter(v => v.shape && v.metal);
}

/* ---------------- Cart: several lines at once, with line attributes (a ring = setting + diamond) ---------------- */
export type NewLine = { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] };
export async function createCartWithLines(lines: NewLine[]): Promise<Cart | null> {
  const d = await sf<{ cartCreate: CartPayload }>(
    `mutation($lines:[CartLineInput!]!){ cartCreate(input:{lines:$lines}){ cart{ ${CART_FIELDS} } userErrors{ message } } }`, { lines }, { fresh: true });
  return d?.cartCreate.cart ? shapeCart(d.cartCreate.cart) : null;
}
export async function addCartLines(cartId: string, lines: NewLine[]): Promise<Cart | null> {
  const d = await sf<{ cartLinesAdd: CartPayload }>(
    `mutation($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId,lines:$lines){ cart{ ${CART_FIELDS} } userErrors{ message } } }`, { cartId, lines }, { fresh: true });
  return d?.cartLinesAdd.cart ? shapeCart(d.cartLinesAdd.cart) : null;
}
export async function updateLineAttributes(cartId: string, updates: { id: string; quantity: number; attributes: { key: string; value: string }[] }[]): Promise<Cart | null> {
  const d = await sf<{ cartLinesUpdate: CartPayload }>(
    `mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){ cartLinesUpdate(cartId:$cartId,lines:$lines){ cart{ ${CART_FIELDS} } userErrors{ message } } }`, { cartId, lines: updates }, { fresh: true });
  return d?.cartLinesUpdate.cart ? shapeCart(d.cartLinesUpdate.cart) : null;
}
export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart | null> {
  const d = await sf<{ cartLinesRemove: CartPayload }>(
    `mutation($cartId:ID!,$lineIds:[ID!]!){ cartLinesRemove(cartId:$cartId,lineIds:$lineIds){ cart{ ${CART_FIELDS} } userErrors{ message } } }`, { cartId, lineIds }, { fresh: true });
  return d?.cartLinesRemove.cart ? shapeCart(d.cartLinesRemove.cart) : null;
}

/** The current handle of a product that used to have this one (kept as an "oldhandle-" tag when links were renamed to titles). */
export async function findByOldHandle(old: string): Promise<string | null> {
  if (!/^[a-z0-9-]{1,255}$/.test(old)) return null;
  const d = await sf<{ products: { edges: { node: { handle: string } }[] } }>(`query($q:String!){ products(first:1, query:$q){ edges{ node{ handle } } } }`, { q: `tag:oldhandle-${old}` });
  return d?.products.edges[0]?.node.handle ?? null;
}
