# MEEKITAZ — Next.js storefront

Serious diamonds, worn lightly. Next.js 16 (App Router) + Shopify Storefront API, deployed on Vercel.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in Shopify values (optional until the store is ready)
npm run dev
```

## Deploy (GitHub → Vercel)
1. Create a new GitHub repo (e.g. `meekitaz`), push this folder.
2. In Vercel: **Add New Project → Import** the repo. Framework is auto-detected (Next.js). Deploy.
3. Add env vars in Vercel → Settings → Environment Variables (see `.env.example`), then redeploy.
4. Point the `meekitaz.com` domain to the Vercel project.

## Shopify
- In Shopify admin install the **Headless** channel → create a storefront → copy the **public Storefront API access token** and the store domain.
- Create collections with these handles so they map to the category pages automatically:
  `engagement-rings`, `diamonds`, `earrings`, `necklaces`, `bracelets`, `bands`.
- `src/lib/shopify.ts` fetches each collection; until env vars are set, the grids show the "Coming soon" placeholders.
- **Cart (side drawer):** built. `src/components/CartProvider.tsx` + `CartDrawer.tsx`, backed by `/api/cart` (Storefront `cartCreate` / `cartLinesAdd` / `cartLinesUpdate` / `cartLinesRemove`). The cart id lives in an httpOnly cookie; **Checkout** goes to Shopify's hosted checkout (`cart.checkoutUrl`). Call `useCart().add(variantId)` from any "Add to bag" button; it adds the item and opens the drawer.
- Next steps (not yet built): `/products/[handle]` page with the Add-to-bag button, "Complete the look" and gift note in the drawer, and wiring the style circles / filters (`?style=`) to real queries.

## Where things live
- `src/lib/data.ts` — all copy and image URLs (hero slides, menu tiles, categories, house codes, reviews, category pages).
- `src/app/globals.css` — the design system (colors, fonts, every section).
- `src/components/*` — Nav + menu, Hero, Film, Categories, HouseCodes, Reviews, PrivateClients, Footer, ProductGrid, DiamondFilters.
- `src/app/[category]/page.tsx` — the six category pages.
- `src/app/api/appointment/route.ts` — private-client requests (set `APPOINTMENT_WEBHOOK_URL`).
- `public/media/` — the film, poster and the bracelets hero.

## Performance notes
- Every image goes through `next/image` (AVIF/WebP, resized per device); the first hero image and each category hero are `priority`.
- The hero is sticky and static (no scroll animation); the next sections slide over it.
- Reviews and placeholder names are sample content — replace before launch.
