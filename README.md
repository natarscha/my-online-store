# Cloudflare Pages jewellery-store starter (AUD)

This is an educational MVP, not a fully production-ready e-commerce platform.

## Included
- Browser storefront with product listings and cart
- Products/stock in Cloudflare D1 (all prices stored as AUD cents)
- Server-side Stripe Checkout Session creation
- Signed Stripe webhook, order recording, stock decrement, basic duplicate-event protection
- Cloudflare Pages Functions for APIs

## Deployment
1. Create a Cloudflare Pages project **via Git integration** (recommended), or deploy with Wrangler CLI. Dashboard drag-and-drop does not compile the `functions/` directory.
2. Put this project into a GitHub repository. In Cloudflare Workers & Pages > Create > Pages > Connect to Git, choose the repository. Build command: leave blank; output directory: `public`. Root: repository root.
3. Create a D1 database named `jewellery-store` via Cloudflare > D1 SQL Database.
4. From your computer run `npx wrangler d1 execute jewellery-store --remote --file=./schema.sql` in this folder (login using `npx wrangler login`).
5. In Pages project > Settings > Bindings, add a D1 database binding named **DB** to `jewellery-store`, in production (and preview if needed). Redeploy.
6. In Pages project > Settings > Variables and Secrets, add **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** as encrypted secrets. Redeploy.
7. In Stripe Dashboard, create webhook destination `https://YOUR-PROJECT.pages.dev/webhooks/stripe`, subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and copy its signing secret.
8. In Stripe use test keys first. Test with Stripe's test cards and confirm stock and `orders` rows change in D1. Switch to live credentials and update the live webhook only after reviewing the checklist below.

## Production checklist (must do)
- Shipping address + shipping rates: this starter DOES NOT collect shipping addresses and should not be used to sell physical items until configured.
- Stock reservations: this starter does not reserve stock during Checkout. Two customers can pay for the last item; a `stock_issue` order requires manual resolution/refund. Implement atomic reservations + Stripe session expiration cleanup before production use.
- Multi-item inventory + webhook idempotency: harden transactional order processing for parallel webhooks and partial stock depletion; consider a separate order-reservation table and an expiry job.
- Payment failures, refunds, exchanges and cancellations require inventory restoration rules.
- Add order notification email, admin authentication, taxes, privacy policy, terms, returns, and shipping policies.
- Stripe has fees. Cloudflare usage beyond free tiers may cost money.
- Never expose the Stripe secret key, webhook secret, or database write access to the browser.
- Prices and stock are for illustration. Replace SQL seed product records and branding before publication.

## File tree
- `public/`: website files
- `functions/api/products.js`: read products from D1
- `functions/api/checkout.js`: server-authenticated checkout session
- `functions/webhooks/stripe.js`: signed paid-webhook handler
- `schema.sql`: D1 schema and example inventory

## Product maintenance
In D1 console, use a parameterized admin tool (build authenticated access before exposing edits on the web), or SQL directly for a small catalogue:
`UPDATE products SET stock = 25 WHERE id = 'silver-stack';`
`UPDATE products SET price_cents = 3295 WHERE id = 'silver-stack';`

Reference documentation:
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/d1/get-started/
- https://docs.stripe.com/checkout/quickstart
- https://docs.stripe.com/webhooks
