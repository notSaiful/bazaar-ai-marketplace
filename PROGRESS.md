# PROGRESS

Status: **prototype complete, demo-ready, and simplified per owner feedback (see "Simplification pass"). `npm run build` passes; `npm run evals` passes 99/99** (report in `evals/report.md`). Verified by running the production server and exercising checkout, payment, webhooks, seller/admin pages and the MCP endpoint over HTTP.

## Simplification pass (owner feedback: minimalistic and easy to use)
- **Buying in 3 taps**: Add (card or product page) opens the cart with one Checkout button → one short delivery form (pre-filled) → one Pay button. Removed "Buy now", toast, per-seller summary cards, payment-method tabs.
- **Storefront**: home is now title + search + 5 category pills + one product grid (removed festive row, seller cards, 4 feature cards, badges, ratings, strike-through MRP). Product cards show image, name, seller, price, Add. Product page is image, name, price, one Add button, description; attributes and reviews are tucked into one collapsible. Filters collapsed into "Sort & filter". Header: logo, search (hidden on home where the hero has one), orders, view switcher, theme, cart. Language toggle moved to the footer.
- **Seller**: 4 tabs (Home, Products, Orders, Earnings) instead of a sidebar of 6. Home = one primary button ("Add a product from a photo") + 3 numbers + a low-stock list only when needed. Listing: photo → name, price, stock → **Publish** (description, Hindi, category, tags tucked under "More details"). Orders: 3 tabs and one action button per order that names the next step ("Accept", "Mark packed"…); the fee split stays visible as one line on every order.
- **Admin**: 4 tabs (Overview, Sellers, Orders, Money). Overview opens on "Needs your attention" where a pending shop or flagged listing is approved in one click; then 3 numbers, one chart, top sellers; copilot is collapsed. Commission editing moved into the Sellers list; payouts + reconciliation + webhook replay merged into Money (technical ledger detail collapsed). Moderation page merged into Overview; old `/admin/commission`, `/admin/payouts`, `/admin/products` redirect.
- **Finished from the brief**: Razorpay Checkout widget wired for when test keys are set (previously missing); copy tightened to plain labels.
- Everything above keeps the ledger, evals (99/99) and build passing; no behaviour was removed, only moved or collapsed.

## What works (real code paths, runs with zero API keys)
- **Storefront**: home, category/search (filters, sort, price range held in the URL), product page (live stock badge that polls every 2 s, seller card, reviews, JSON-LD), seller store pages, multi-seller cart drawer + page grouped by seller, checkout with pincode check, order list and tracking, EN/हि interface toggle, dark/light, skeletons, empty states, keyboard/aria basics.
- **Checkout & payments**: one payment → one order group + one order per seller; atomic stock reservation (all-or-nothing), release on failure/expiry (10 min); mock Razorpay checkout that emits a **signed webhook through the real handler**; signature verification; idempotent capture (replay creates nothing; admin can replay from the Ledger page).
- **Commission engine + ledger**: integer paise, round-half-up per line, rate snapshotted on every order line, double-entry ledger (capture, refund with reversals, payout), reconciliation view reads ₹0.00. Visible **Order total / Platform fee / Seller payout** split on every order (customer, seller, admin views).
- **Seller portal**: onboarding (pending until approved; pending stores can't publish), product create/edit/archive, inventory with low-stock alerts and restock, fulfilment workflow with invalid transitions rejected, earnings statement that equals the ledger balance, new-order toast (polling), AI restock suggestion with Apply.
- **Admin**: seller approve/suspend/reinstate (suspended products leave the storefront immediately), product moderation queue, all-orders view with refund, per-seller commission (future orders only), simulated payouts, ledger + webhook log, KPI tiles, GMV trend, top sellers, category mix, fraud/anomaly queue with reasons, read-only copilot with charts, audit log (recorded; no UI), demo reset.
- **AI**: (a) photo-to-listing: upload (resized client-side) or sample photo → Zod-validated draft with EN + HI title/description, category, attributes, tags, price *hint*, confidence, retake prompt for unusable photos; seller edits and confirms; the model never sets the price. (b) Hinglish/Hindi/English hybrid search (keyword + concept ranker fused with RRF, typo tolerance, price parsing like "2000 tak", "why this matched") and a guarded shopping assistant that builds multi-seller carts from DB prices/stock, declines off-topic and manipulation attempts, shows its tool trace. (c) `/.well-known/ucp` discovery doc, MCP JSON-RPC endpoint (`search_products`, `get_product`, `create_cart`, `create_checkout`, `get_order_status`) and REST equivalents; server-side price authority, rate limits, token-scoped order status, human pay link.
- **Evals** (`scripts/evals.ts`): commission rounding, PRD refund scenario, ledger balance, webhook signature/replay, stock race on the last unit, failed-payment release, tenancy/transition rules, 18-query Hinglish golden set (hit-rate and p95 latency, well under 150 ms), agent price/stock/budget accuracy, prompt-injection and refusal sets, MCP flow, listing-schema validity.

## What is mocked or simulated (be upfront in the demo)
- **Data layer is local in-memory** (`src/lib/store.ts`), reset on server restart; on Vercel it is per-instance, so it is for demos, not production. Supabase has **schema, RLS and SQL functions** plus prepared clients, but the app does not read/write Supabase yet.
- **Auth is a role switcher** (cookie), not real auth. Server actions check the role cookie, but this is demo-grade, not a security boundary.
- **Razorpay**: mock checkout by default. Real order creation + signature verification are implemented (`src/lib/razorpay.ts`, `/api/payments/verify`) but never run against Razorpay. The Razorpay Checkout widget is wired in `PayPanel` but untested without keys. **Route transfers are simulated** and labelled as such.
- **AI**: without `ANTHROPIC_API_KEY`, photo-to-listing is a deterministic mock keyed on filename/hint/hash (not real vision). The live vision call is untested. The shopping assistant, copilot and anomaly rules are deterministic, not LLM-driven; "semantic" search uses an intent dictionary, not embeddings/pgvector.
- Courier tracking is internal status only; images are generated SVG illustrations; realtime features (stock badge, order updates, seller toast) use polling.
- `/.well-known/ucp` follows the UCP shape from memory of ucp.dev; it has **not** been validated against the official schema or conformance tests.

## Known gaps
- SQL migrations were not executed against Postgres; expect small fixes on first apply. No automated RLS test yet.
- No reviews submission, no variants selector (attributes only), no multiple image upload, audit log has no UI, refunds are full-seller-order only, gateway fees not modelled (PRD Q-08).
- ESLint reports 4 `react-hooks/set-state-in-effect` errors (hydrating cart/theme from localStorage and debounced search); the build does not lint.
- Lighthouse/Core Web Vitals were not measured; no real-phone test was done.
- No automated browser end-to-end test (verified via HTTP + eval suite); only the home and product pages were visually checked in headless Chrome (before and after simplification).
- Orders seeded as relative dates; analytics charts cover the last 14 days.

## Next steps
1. Apply migrations to a Supabase project, implement a `SupabaseStore` behind the same function signatures, add two-vendor RLS tests, wire Supabase Auth.
2. Razorpay test keys: Checkout widget, webhook endpoint registration, Route linked accounts + transfers + reversals.
3. Real AI: vision model for listings with a 20-photo eval set and native-speaker Hindi review, embeddings + pgvector for search, LLM phrasing for the assistant behind the same guarded tools, promptfoo/CI.
4. Measure Lighthouse and CWV, tune; add Playwright critical-path test; record the backup demo video.
5. Validate the UCP document against the official schema and run conformance tests.

## Commands
`npm run dev` · `npm run build` · `npm start` · `npm run evals` · `npm run typecheck`
