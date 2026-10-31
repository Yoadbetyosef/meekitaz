// Shopify Storefront API client (server only).
import { collapseDesigns, gemFacets, hasPhoto } from "./designs";
import { cardImage, isSupplierImage } from "./supplierImages";
import { RING_SHAPES } from "./ringfilters";
import { fancyColorOf } from "./fancy";
// Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in .env.local / Vercel.
export type Product = { edit?: boolean; id: string; handle: string; title: string; price: string; currency: string; compareAt?: number; image?: { url: string; alt: string }; modelImage?: string; code?: string; metal?: string; shape?: string; stone?: string; variants?: { metal: string; handle: string; title: string; image?: { url: string; alt: string }; modelImage?: string; price: string; compareAt?: number }[] };

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
    `query($handle:String!,$first:Int!){ collection(handle:$handle){ products(first:$first){ edges{ node{ id handle title priceRange{ minVariantPrice{ amount currencyCode } } featuredImage{ url altText } images(first:3){ edges{ node{ url altText } } } model: metafield(namespace:"meekitaz", key:"model_image"){ value } } } } } }`,
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
    product: { title: string; handle: string; featuredImage?: { url: string; altText?: string } | null; model?: { value: string } | null };
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
  options: { name: string; values: string[] }[]; images: { url: string; alt: string; width: number; height: number }[]; modelImage?: string; videoUrl?: string; variants: ProductVariant[]; currency: string; seoTitle?: string; seoDescription?: string;
};
export type Sibling = { handle: string; title: string; metal: string; image?: string; modelImage?: string };
export type Related = { handle: string; title: string; price: number; compareAt: number; image?: string };

export const METALS = ["Rose Gold", "Yellow Gold", "White Gold", "Platinum", "Silver"];
export const metalOf = (tags: string[]) => METALS.find(m => tags.some(t => t.toLowerCase() === m.toLowerCase())) || "";
export const designCode = (tags: string[]) => tags.find(t => /^NS-\d+$/i.test(t)) || "";

export async function getProductByHandle(handle: string): Promise<ProductFull | null> {
  const d = await sf<{ product: null | { id: string; handle: string; title: string; description: string; descriptionHtml: string; productType: string; tags: string[];
    seo: { title?: string; description?: string }; options: { name: string; values: string[] }[];
    images: { edges: { node: { url: string; altText?: string; width: number; height: number } }[] }; model?: { value: string } | null; film?: { value: string } | null;
    variants: { edges: { node: { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; compareAtPrice?: { amount: string } | null; selectedOptions: { name: string; value: string }[]; image?: { url: string } | null } }[] } } }>(
    `query($handle:String!){ product(handle:$handle){ id handle title description descriptionHtml productType tags seo{ title description } options{ name values }
      images(first:20){ edges{ node{ url altText width height } } } model: metafield(namespace:"meekitaz", key:"model_image"){ value } film: metafield(namespace:"meekitaz", key:"video"){ value }
      variants(first:60){ edges{ node{ id title availableForSale price{ amount currencyCode } compareAtPrice{ amount } selectedOptions{ name value } image{ url } } } } } }`, { handle });
  const p = d?.product; if (!p) return null;
  const vs = p.variants.edges.map(({ node: v }) => ({ id: v.id, title: v.title, available: v.availableForSale, price: +v.price.amount, compareAt: v.compareAtPrice && +v.compareAtPrice.amount > +v.price.amount ? +v.compareAtPrice.amount : 0, selected: v.selectedOptions, imageUrl: v.image?.url }));
  return {
    id: p.id, handle: p.handle, title: p.title, description: p.description, descriptionHtml: p.descriptionHtml.replace(/\s*One of each; it ships within 48 hours\./g, " One of each, ready to ship."), productType: p.productType, tags: p.tags,
    options: p.options, images: p.images.edges.filter(({ node: i }) => !isSupplierImage(i.url, p.tags) && ownMetal(i.url, p.tags)).map(({ node: i }) => ({ url: i.url, alt: i.altText || p.title, width: i.width, height: i.height })), modelImage: p.model?.value || undefined, videoUrl: p.film?.value || undefined, variants: vs,
    currency: p.variants.edges[0]?.node.price.currencyCode || "USD", seoTitle: p.seo?.title || undefined, seoDescription: p.seo?.description || undefined,
  };
}

/** The same design in other metals (Shopify holds each metal as its own product, linked by the NS design code tag). */
/** The title with its metal prefix removed: "Yellow gold Sq.Cushion Diamond Solitaire Stud Earrings" → "Sq.Cushion Diamond Solitaire Stud Earrings". Two products are the same design only if this matches. */
export const designTitle = (title: string) => title.replace(/^(White|Yellow|Rose)\s+gold\s+|^(Platinum|Silver)\s+/i, "").trim().toLowerCase();

export async function getSiblings(code: string, exceptHandle: string, exceptTitle = ""): Promise<Sibling[]> {
  if (!code) return [];
  const d = await sf<{ products: { edges: { node: { handle: string; title: string; tags: string[]; featuredImage?: { url: string } | null; model?: { value: string } | null } }[] } }>(
    `query($q:String!){ products(first:40, query:$q){ edges{ node{ handle title tags featuredImage{ url } model: metafield(namespace:"meekitaz", key:"model_image"){ value } } } } }`, { q: `tag:${code}` });
  // metal from the tag when it is a full name, otherwise from the title ("White gold …", "Platinum …"), so no metal of the design is dropped;
  // configured / karat / stone products created at checkout are not siblings
  const seen = new Set<string>();
  const mine = exceptTitle ? designTitle(exceptTitle) : "";
  return (d?.products.edges || []).filter(({ node }) => !node.tags.some(t => ["Configured", "Karat variant", "Diamond"].includes(t)))
    // one design code can cover several shapes (NS-2499 is a stud in eight shapes): only the same shape counts as a sibling
    .filter(({ node }) => !mine || node.handle === exceptHandle || designTitle(node.title) === mine)
    .map(({ node }) => ({ handle: node.handle, title: node.title, metal: metalOf(node.tags) || ringMetalOf(node.title), image: node.featuredImage?.url, modelImage: node.model?.value || undefined }))
    .filter(x => { if (!x.metal && x.handle !== exceptHandle) return false; const k = x.metal || x.handle; if (seen.has(k) && x.handle !== exceptHandle) return false; seen.add(k); return true; });
}

export async function getRelated(productType: string, exceptHandle: string, first = 4): Promise<Related[]> {
  if (!productType) return [];
  const d = await sf<{ products: { edges: { node: { handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string } | null } }[] } }>(
    `query($q:String!,$n:Int!){ products(first:$n, query:$q, sortKey:BEST_SELLING){ edges{ node{ handle title tags priceRange{ minVariantPrice{ amount } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url } } } } }`,
    { q: `product_type:"${productType.replace(/"/g, "")}" AND -tag:Configured AND -tag:'Karat variant'`, n: first + 6 });
  return (d?.products.edges || []).map(e => e.node).filter(n => n.handle !== exceptHandle && !n.tags.some(t => ["configured", "karat variant", "fifa world cup 2026"].includes(t.toLowerCase())))
    .slice(0, first).map(n => ({ handle: n.handle, title: n.title, price: +n.priceRange.minVariantPrice.amount, compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0, image: n.featuredImage && !isSupplierImage(n.featuredImage.url, n.tags) ? n.featuredImage.url : undefined }));
}


/* ---------------- New imports listed last ----------------
   Pieces added from the new collection (tag "Meekitaz Edit") come after everything that was already in the store, on the default (best-selling) order:
   the listing first pages through the store without them, then pages through them alone. The phase rides in the cursor ("E|" + cursor). */
export const EDIT_TAG = "Meekitaz Edit";
const EDIT_CAT: Record<string, string> = { earrings: "Earrings", necklaces: "Necklace", bracelets: "Bracelets", bands: "Wedding Bands" };
type Page = { products: Product[]; hasNext: boolean; cursor: string | null } | null;
const isPhase2 = (c?: string | null) => !!c && c.startsWith("E|");
const inner = (c?: string | null) => (c && c.startsWith("E|") ? c.slice(2) || null : c || null);
const toPhase2 = (r: Page): Page => r && { ...r, cursor: "E|" + (r.cursor || ""), hasNext: r.hasNext };
export async function getProductsByQuery(query: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<Page> {
  if (opts.sort && opts.sort !== "best") return getProductsByQueryRaw(query, opts);
  if (isPhase2(opts.after)) return toPhase2(await getProductsByQueryRaw(`(${query}) AND tag:'${EDIT_TAG}'`, { ...opts, after: inner(opts.after) }));
  const r = await getProductsByQueryRaw(`(${query}) AND -tag:'${EDIT_TAG}'`, opts);
  if (r && !r.hasNext) {
    if (r.products.length) return { ...r, hasNext: true, cursor: "E|" };
    return toPhase2(await getProductsByQueryRaw(`(${query}) AND tag:'${EDIT_TAG}'`, { ...opts, after: null }));
  }
  return r;
}
export async function getCollectionPage(handle: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<Page> {
  const cat = EDIT_CAT[handle];
  if (!cat || (opts.sort && opts.sort !== "best")) return getCollectionPageRaw(handle, opts);
  if (isPhase2(opts.after)) return toPhase2(await getProductsByQueryRaw(`tag:'${EDIT_TAG}' AND tag:'${cat}' AND -tag:'Configured' AND -tag:'Karat variant'`, { ...opts, after: inner(opts.after) }));
  const r = await getCollectionPageRaw(handle, opts);
  if (!r) return r;
  const kept = { ...r, products: r.products.filter(p => !p.edit) };
  return r.hasNext ? kept : { ...kept, hasNext: true, cursor: "E|" };
}

/* ---------------- Category listing with paging and sorting ---------------- */
export const SORTS: Record<string, { key: string; reverse: boolean }> = {
  best: { key: "BEST_SELLING", reverse: false }, new: { key: "CREATED", reverse: true },
  price_asc: { key: "PRICE", reverse: false }, price_desc: { key: "PRICE", reverse: true },
};
/* A collection page hides pieces that live elsewhere (Ready to Ship…). When a whole batch is hidden, fetch the next batch, so the page is
   never empty while the collection still has pieces to show. */
/* Earrings, bracelets, necklaces: the house catalogue first (yellow gold up front, as always), and the one-of-ones we added after it,
   at the end. The cursor "oo:…" marks the second part. */
const OOO_KIND: Record<string, string> = { earrings: "tag:'Earrings'", bracelets: "tag:'Bracelets'", necklaces: "(tag:'Necklaces' OR tag:'Pendants')" };
async function getCollectionPageRaw(handle: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const kind = OOO_KIND[handle];
  if (kind && opts.after?.startsWith("oo:")) {
    const r = await getProductsByQueryRaw(`tag:'One of One' AND ${kind}`, { first: opts.first, after: opts.after.slice(3) || null, sort: "new" });
    return r ? { ...r, cursor: r.cursor ? `oo:${r.cursor}` : null } : null;
  }
  const house = await getCollectionPageRaw0(handle, { ...opts, noOoo: !!kind });
  if (kind && house && !house.hasNext) return { ...house, hasNext: true, cursor: "oo:" }; // catalogue done: the one-of-ones follow
  return house;
}
async function getCollectionPageRaw0(handle: string, opts: { first?: number; after?: string | null; sort?: string; noOoo?: boolean } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const want = opts.first || 24; let after = opts.after || null; const all: Product[] = []; let last: { products: Product[]; hasNext: boolean; cursor: string | null } | null = null;
  for (let i = 0; i < 6; i++) {
    last = await getCollectionBatch(handle, { ...opts, after });
    if (!last) return all.length ? { products: all, hasNext: false, cursor: after } : null;
    all.push(...last.products);
    if (all.length >= want || !last.hasNext) break;
    after = last.cursor;
  }
  return { products: all, hasNext: !!last?.hasNext, cursor: last?.cursor ?? null };
}
async function getCollectionBatch(handle: string, opts: { first?: number; after?: string | null; sort?: string; noOoo?: boolean } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const so = SORTS[opts.sort || "best"] || SORTS.best;
  const d = await sf<{ collection: null | { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string; altText?: string } | null; model?: { value: string } | null } }[] } } }>(
    `query($handle:String!,$first:Int!,$after:String,$key:ProductCollectionSortKeys!,$rev:Boolean!){ collection(handle:$handle){ products(first:$first, after:$after, sortKey:$key, reverse:$rev){
      pageInfo{ hasNextPage endCursor }
      edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount currencyCode } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url altText } images(first:3){ edges{ node{ url altText } } } model: metafield(namespace:"meekitaz", key:"model_image"){ value } } } } } }`,
    { handle, first: Math.min(120, (opts.first || 24) * 4), after: opts.after || null, key: so.key, rev: so.reverse });
  const c = d?.collection?.products; if (!c) return null;
  const products = c.edges.map(e => e.node).filter(n => !n.tags.some(t => t.toLowerCase() === "fifa world cup 2026" || (t === "Ready to Ship" && handle !== "ready-to-ship") || (t === "One of One" && (/engagement/.test(handle) || !!opts.noOoo)))).map(n => ({
    id: n.id, handle: n.handle, title: n.title, price: n.priceRange.minVariantPrice.amount, currency: n.priceRange.minVariantPrice.currencyCode,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    image: cardImage(n as unknown as Parameters<typeof cardImage>[0]), modelImage: n.model?.value || handPhoto(n as unknown as { images?: { edges: { node: { url: string } }[] } }),
    edit: n.tags.includes(EDIT_TAG), code: n.tags.find(t => /^NS-\d+$/.test(t)) || "", metal: ringMetalOf(n.title), shape: n.tags.find(t => RING_SHAPES.includes(t)) || gemFacets(n.title, n.tags).shape, stone: gemFacets(n.title, n.tags).stone,
  }));
  return { products: collapseDesigns(products.filter(hasPhoto)), hasNext: c.pageInfo.hasNextPage, cursor: c.pageInfo.endCursor };
}

/** Cards for a Shopify product search (used by the filtered category pages). */
const PSORT: Record<string, { key: string; rev: boolean }> = { best: { key: "BEST_SELLING", rev: false }, new: { key: "CREATED_AT", rev: true }, price_asc: { key: "PRICE", rev: false }, price_desc: { key: "PRICE", rev: true } };
async function getProductsByQueryRaw(query: string, opts: { first?: number; after?: string | null; sort?: string } = {}): Promise<{ products: Product[]; hasNext: boolean; cursor: string | null } | null> {
  const so = PSORT[opts.sort || "best"] || PSORT.best;
  const d = await sf<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage?: { url: string; altText?: string } | null; model?: { value: string } | null } }[] } }>(
    `query($q:String!,$first:Int!,$after:String,$key:ProductSortKeys,$rev:Boolean){ products(first:$first, after:$after, query:$q, sortKey:$key, reverse:$rev){
      pageInfo{ hasNextPage endCursor }
      edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount currencyCode } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url altText } images(first:3){ edges{ node{ url altText } } } model: metafield(namespace:"meekitaz", key:"model_image"){ value } } } } }`,
    { q: /Ready to Ship|One of One/.test(query) ? query : `(${query}) AND -tag:'Ready to Ship'${/engagement/i.test(query) ? " AND -tag:'One of One'" : ""}`, first: Math.min(120, (opts.first || 24) * 4), after: opts.after || null, key: so.key, rev: so.rev }); // Ready to Ship lives only in its own feed
  const c = d?.products; if (!c) return null;
  const products = c.edges.map(e => e.node).filter(n => !n.tags.some(t => t.toLowerCase() === "fifa world cup 2026")).map(n => ({
    id: n.id, handle: n.handle, title: n.title, price: n.priceRange.minVariantPrice.amount, currency: n.priceRange.minVariantPrice.currencyCode,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    image: cardImage(n as unknown as Parameters<typeof cardImage>[0]), modelImage: n.model?.value || handPhoto(n as unknown as { images?: { edges: { node: { url: string } }[] } }),
    edit: n.tags.includes(EDIT_TAG), code: n.tags.find(t => /^NS-\d+$/.test(t)) || "", metal: ringMetalOf(n.title), shape: n.tags.find(t => RING_SHAPES.includes(t)) || gemFacets(n.title, n.tags).shape, stone: gemFacets(n.title, n.tags).stone,
  }));
  return { products: collapseDesigns(products.filter(hasPhoto)), hasNext: c.pageInfo.hasNextPage, cursor: c.pageInfo.endCursor };
}

/** Free-text product search, collapsed to one card per design. Storefront `search` first (relevance-ranked, tolerant of small typos, the last word matched
 *  as a prefix); if it errors or finds nothing, the same words are looked up in titles and tags with the product query the category pages already use. */
const STOP = new Set(["the", "and", "for", "with", "a", "of", "in"]);
const BAD_TAGS = ["Configured", "Karat variant", "Diamond", "care-package"];
export async function searchProducts(query: string, opts: { first?: number; maxPrice?: number } = {}): Promise<Product[] | null> {
  type N = { id?: string; handle?: string; title?: string; tags?: string[]; priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }; compareAtPriceRange?: { minVariantPrice: { amount: string } }; featuredImage?: { url: string; altText?: string } | null; model?: { value: string } | null };
  const first = opts.first || 60;
  const d = await sf<{ search: { nodes: N[] } }>(
    `query($q:String!,$first:Int!,$f:[ProductFilter!]){ search(query:$q, first:$first, types:PRODUCT, prefix:LAST, productFilters:$f){ nodes{ ... on Product { id handle title tags priceRange{ minVariantPrice{ amount currencyCode } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url altText } images(first:3){ edges{ node{ url altText } } } model: metafield(namespace:"meekitaz", key:"model_image"){ value } } } } }`,
    { q: query, first, f: opts.maxPrice ? [{ price: { max: opts.maxPrice } }] : null });
  let products: Product[] = (d?.search.nodes || [])
    .filter((n): n is Required<Pick<N, "id" | "handle" | "title" | "tags" | "priceRange" | "compareAtPriceRange">> & N => !!n.id && !!n.tags && !n.tags.some(t => BAD_TAGS.includes(t) || t === "Ready to Ship" || t.toLowerCase() === "fifa world cup 2026"))
    .map(n => ({
      id: n.id!, handle: n.handle!, title: n.title!, price: n.priceRange!.minVariantPrice.amount, currency: n.priceRange!.minVariantPrice.currencyCode,
      compareAt: +n.compareAtPriceRange!.minVariantPrice.amount > +n.priceRange!.minVariantPrice.amount ? +n.compareAtPriceRange!.minVariantPrice.amount : 0,
      image: cardImage({ title: n.title!, tags: n.tags!, featuredImage: n.featuredImage, images: (n as { images?: { edges: { node: { url: string; altText?: string } }[] } }).images }),
      edit: n.tags!.includes(EDIT_TAG), code: n.tags!.find(t => /^NS-\d+$/.test(t)) || "", metal: ringMetalOf(n.title!), shape: n.tags!.find(t => RING_SHAPES.includes(t)) || "",
    }));
  if (products.length) { const all = collapseDesigns(products.filter(hasPhoto)); return [...all.filter(p => !p.edit), ...all.filter(p => p.edit)]; }
  // fallback: every word must be in the title or a tag
  const tokens = query.toLowerCase().split(/[^a-z0-9é]+/).filter(t => t.length > 1 && !STOP.has(t)).slice(0, 5);
  if (!tokens.length) return d ? [] : null;
  const q = tokens.map(t => { const one = t.replace(/s$/, ""); return `(title:${t}* OR title:${one}* OR tag:${one})`; }).join(" AND ")
    + ` AND ${BAD_TAGS.map(t => `-tag:'${t}'`).join(" AND ")}` + (opts.maxPrice ? ` AND variants.price:<=${opts.maxPrice}` : "");
  const r = await getProductsByQuery(q, { first });
  return r ? r.products : d ? [] : null;
}

/* ---------------- Engagement-ring settings: one design in every shape and metal ---------------- */
export type RingVariant = { id: string; handle: string; title: string; shape: string; metal: string; price: number; compareAt: number; images: string[]; variantId: string; modelImage?: string };
const SHAPE_NAMES = ["Round", "Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Asscher", "Heart"];
const METAL_RE = /(Rose gold|Yellow gold|White gold|Platinum|Silver)/i;
export const ringMetalOf = (title: string) => { const m = title.match(METAL_RE); if (!m) return ""; const t = m[1].toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
export const ringShapeOf = (tags: string[], title: string) => SHAPE_NAMES.find(n => tags.includes(n)) || SHAPE_NAMES.find(n => new RegExp(`\\b${n}\\b`, "i").test(title)) || "";
/** One design in every shape and metal. A design exists in white and in fancy colours under the same code, so the family is for one colour ("" = white). */
export async function getRingFamily(code: string, color = ""): Promise<RingVariant[]> {
  if (!code) return [];
  const d = await sf<{ products: { edges: { node: { id: string; handle: string; title: string; tags: string[]; priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; images: { edges: { node: { url: string } }[] }; variants: { edges: { node: { id: string } }[] }; model?: { value: string } | null } }[] } }>(
    `query($q:String!){ products(first:250, query:$q){ edges{ node{ id handle title tags priceRange{ minVariantPrice{ amount } } compareAtPriceRange{ minVariantPrice{ amount } } images(first:4){ edges{ node{ url } } } variants(first:1){ edges{ node{ id } } } model: metafield(namespace:\"meekitaz\", key:\"model_image\"){ value } } } } }`, { q: color ? `tag:${code} AND title:'Fancy ${color}'` : `tag:${code}` });
  const list = (d?.products.edges || []).map(e => e.node).filter(n => n.tags.includes("Engagement Ring") && n.tags.includes(code) && fancyColorOf(n.title) === color).map(n => ({
    id: n.id, handle: n.handle, title: n.title, shape: ringShapeOf(n.tags, n.title), metal: ringMetalOf(n.title), price: +n.priceRange.minVariantPrice.amount,
    compareAt: +n.compareAtPriceRange.minVariantPrice.amount > +n.priceRange.minVariantPrice.amount ? +n.compareAtPriceRange.minVariantPrice.amount : 0,
    images: n.images.edges.map(i => i.node.url).filter(u => !isSupplierImage(u, n.tags)), variantId: n.variants.edges[0]?.node.id || "", modelImage: n.model?.value || undefined,
  })).filter(v => v.shape && v.metal && v.images.length > 0); // a shape or metal with no photo is not offered
  // the worn photo is made once per shape: a metal without its own shows the one of the same shape (yellow gold first), and a shape never shows another shape's
  const byShape: Record<string, string> = {}; for (const v of list) if (v.modelImage && (!byShape[v.shape] || /yellow/i.test(v.metal))) byShape[v.shape] = v.modelImage;
  return list.map(v => (v.modelImage || !byShape[v.shape] ? v : { ...v, modelImage: byShape[v.shape] }));
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

/** Puts discount codes on a cart (replaces the codes already on it). */
export async function setCartDiscountCodes(cartId: string, codes: string[]): Promise<Cart | null> {
  const d = await sf<{ cartDiscountCodesUpdate: CartPayload }>(
    `mutation($cartId:ID!,$codes:[String!]!){ cartDiscountCodesUpdate(cartId:$cartId,discountCodes:$codes){ cart{ ${CART_FIELDS} } userErrors{ message } } }`,
    { cartId, codes }, { fresh: true });
  return d?.cartDiscountCodesUpdate.cart ? shapeCart(d.cartDiscountCodesUpdate.cart) : null;
}

/** Card hover for supplier pieces without our own worn photo: their on-hand shot (CGD files SKU-<metal>-2.jpg). */
function handPhoto(n: { images?: { edges: { node: { url: string } }[] } }): string | undefined {
  return n.images?.edges.map(e => e.node.url).find(u => /-(Y|W|R|YW|RW|YRW|YR)-2\.jpg/i.test(u));
}
/** One-of-one galleries: the supplier files are named SKU-<metal>-n.jpg; keep only the ring's own metal (Y, W, R, YW, RW, YRW). */
function ownMetal(url: string, tags: string[]): boolean {
  if (!tags.includes("One of One")) return true;
  const m = /-(Y|W|R|YW|RW|YRW|YR)-\d\.jpg/i.exec(url); if (!m) return true;
  const t = tags.join(" ").toLowerCase(); const want = (t.includes("yellow") ? "Y" : "") + (t.includes("rose") ? "R" : "") + (t.includes("white") ? "W" : "");
  return !want || m[1].toUpperCase() === want;
}
/** The one-of-ones: products tagged "One of One". Sold ones (nothing left to sell) stay in the list, marked claimed. */
export type OneOfOne = { handle: string; title: string; price: number; image?: string; claimed: boolean; isNew: boolean; sub?: string };
/** Hand-picked one-of-ones, in this order (the home-page block). Missing or sold-out handles are skipped by the caller's fallback. */
export async function getOneOfOneByHandles(handles0: string[]): Promise<OneOfOne[]> {
  const handles = await currentHandles(handles0);
  const q = `query{ ${handles.map((h, k) => `p${k}: product(handle:"${h}"){ handle title tags createdAt availableForSale priceRange{ minVariantPrice{ amount } } featuredImage{ url } }`).join(" ")} }`;
  type N = { handle: string; title: string; tags: string[]; createdAt: string; availableForSale: boolean; priceRange: { minVariantPrice: { amount: string } }; featuredImage: { url: string } | null };
  const d = await sf<Record<string, N | null>>(q, {});
  return handles.map((_, k) => d?.[`p${k}`]).filter((n): n is N => !!n).map(n => ({
    handle: n.handle, title: n.title.replace(/^(Yellow|White|Rose)( & White)? gold /i, ""), price: +n.priceRange.minVariantPrice.amount, image: n.featuredImage?.url,
    claimed: !n.availableForSale, isNew: false, sub: ringMetalOf(n.title) || undefined,
  }));
}
export async function getOneOfOne(first = 8): Promise<OneOfOne[]> {
  const d = await sf<{ products: { edges: { node: { handle: string; title: string; tags: string[]; createdAt: string; availableForSale: boolean; priceRange: { minVariantPrice: { amount: string } }; featuredImage: { url: string } | null } }[] } }>(
    `query($first:Int!){ products(first:$first, query:"tag:'One of One'", sortKey:CREATED_AT, reverse:true){ edges{ node{ handle title tags createdAt availableForSale priceRange{ minVariantPrice{ amount } } featuredImage{ url } } } } }`, { first }); // cached a few minutes: the home page must not wait on Shopify for every visit
  const now = Date.now();
  return (d?.products.edges || []).map(({ node: n }) => ({
    handle: n.handle, title: n.title.replace(/^(Yellow|White|Rose) gold /i, "").replace(/ Engagement Ring$/i, ""), price: +n.priceRange.minVariantPrice.amount, image: n.featuredImage?.url,
    claimed: !n.availableForSale, isNew: now - new Date(n.createdAt).getTime() < 14 * 86400000,
    sub: [n.tags.find(t => RING_SHAPES.includes(t)), ringMetalOf(n.title)].filter(Boolean).join(" · ") || undefined,
  }));
}

/** The Reel: ready-to-ship pieces (collection "ready-to-ship"), video first. */
export type ReelItem = { handle: string; title: string; price: number; compare?: number; variantId: string; video?: string; image?: string; detail: string; type: string; available: boolean };
const REEL_FIELDS = `handle title productType availableForSale description(truncateAt: 160) priceRange{ minVariantPrice{ amount } } compareAtPriceRange{ minVariantPrice{ amount } } featuredImage{ url } variants(first:1){ nodes{ id } } video: metafield(namespace:"meekitaz", key:"video"){ value }`;
type ReelNode = { handle: string; title: string; productType: string; availableForSale: boolean; description: string; priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { minVariantPrice: { amount: string } }; featuredImage: { url: string } | null; variants: { nodes: { id: string }[] }; video: { value: string } | null };
const reelItem = (n: ReelNode): ReelItem => ({ handle: n.handle, title: n.title, price: +n.priceRange.minVariantPrice.amount, compare: +n.compareAtPriceRange.minVariantPrice.amount || undefined, variantId: n.variants.nodes[0]?.id || "", video: n.video?.value || undefined, image: n.featuredImage?.url, detail: n.description.replace(/^Ready to ship\.\s*/, "").replace(/\s*One of each.*$/, ""), type: n.productType, available: n.availableForSale });
export async function getReel(first = 24, after: string | null = null, type = "", sort = "new"): Promise<{ items: ReelItem[]; hasNext: boolean; cursor: string | null }> {
  // a search, not a collection: collection filters are ignored on this store, search terms are not
  const q = `tag:'Ready to Ship' AND available_for_sale:true${type ? ` AND product_type:${type}` : ""}`;
  const d = await sf<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ReelNode[] } }>(
    `query($first:Int!,$after:String,$q:String!,$key:ProductSortKeys!,$rev:Boolean!){ products(first:$first, after:$after, query:$q, sortKey:$key, reverse:$rev){ pageInfo{ hasNextPage endCursor } nodes{ ${REEL_FIELDS} } } }`, { first, after, q, key: sort.startsWith("price") ? "PRICE" : "CREATED_AT", rev: sort !== "price_asc" }, { fresh: true });
  const p = d?.products;
  return { items: (p?.nodes || []).filter(n => n.availableForSale).map(reelItem), hasNext: !!p?.pageInfo.hasNextPage, cursor: p?.pageInfo.endCursor || null };
}
/** Hand-picked handles may have been renamed for SEO: map each one to its current handle (old handles live on as tags "oldhandle-…"). */
async function currentHandles(handles: string[]): Promise<string[]> {
  const d = await sf<Record<string, { handle: string } | null>>(`query{ ${handles.map((h, k) => `p${k}: product(handle:"${h}"){ handle }`).join(" ")} }`, {});
  return Promise.all(handles.map(async (h, k) => d?.[`p${k}`] ? h : (await findByOldHandle(h)) || h));
}
export async function getReelByHandles(handles0: string[]): Promise<ReelItem[]> {
  const handles = await currentHandles(handles0);
  // one aliased lookup per handle (the Storefront search index does not filter on handle)
  const q = `query{ ${handles.map((h, k) => `p${k}: product(handle:"${h}"){ ${REEL_FIELDS} }`).join(" ")} }`;
  const d = await sf<Record<string, ReelNode | null>>(q, {}); // cached a few minutes, same reason
  return handles.map((_, k) => d?.[`p${k}`]).filter((n): n is ReelNode => !!n).map(reelItem);
}
