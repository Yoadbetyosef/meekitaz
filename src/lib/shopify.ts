// Shopify Storefront API client (server only).
// Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in .env.local / Vercel.
export type Product = { id: string; handle: string; title: string; price: string; currency: string; image?: { url: string; alt: string } };

export type CartLine = {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  handle: string;
  price: number;      // per unit
  compareAt: number;  // per unit, 0 when there is no compare-at price
  image?: { url: string; alt: string };
};
export type Cart = { id: string; checkoutUrl: string; totalQuantity: number; subtotal: number; savings: number; currency: string; lines: CartLine[] };

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
export const shopifyConfigured = Boolean(domain && token);

async function sf<T>(query: string, variables: Record<string, unknown> = {}, opts: { fresh?: boolean } = {}): Promise<T | null> {
  if (!shopifyConfigured) return null;
  const r = await fetch(`https://${domain}/api/2025-07/graphql.json`, {
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
    id quantity
    merchandise { ... on ProductVariant {
      title price { amount } compareAtPrice { amount }
      image { url altText }
      product { title handle featuredImage { url altText } }
    } }
  } } }`;

type RawCart = {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: { edges: { node: { id: string; quantity: number; merchandise: {
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
      id: node.id, quantity: node.quantity, title: m.product.title,
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
