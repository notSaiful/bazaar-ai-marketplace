# PROGRESS

Status: **QA findings fixed; demo flows work on serverless without a database.** `npm run build` passes, `npm run lint` is clean, `npm run evals` passes **114/114** (report in `evals/report.md`), and `npm run e2e` passes **41/41** in a real browser against **two independent production servers that share only the visitor's cookies** (the local stand-in for several Vercel instances). axe-core reports no serious/critical violations on 15 pages at desktop and mobile widths.

## QA round: all P0/P1 and the requested P2s
**Root cause (P0-1, P0-2, P0-4)**: state lived in per-instance memory and ids were time-derived. **Fix**: a deterministic seed (`grp_seed_01`…, content-hash ids for new records, a virtual clock so replay is exact) plus a per-visitor mutation log in a signed, compressed cookie, replayed on any instance (`src/lib/state.ts`, `persist.ts`, `store.ts`). Every mutating action/route persists it. Replay-equality, tamper rejection, cold-start id stability and cookie size are covered by evals. Agent flows use signed tokens: the cart *is* the token, and the pay link carries a signed claim that the human's browser adopts (`/api/claim`).
| QA item | Result |
|---|---|
| P0-1 `/pay/<id>` 404 | Fixed. Checkout → pay → confirmation with commission split verified across two instances; agent `pay_url` works for a human with no prior state |
| P0-2 "Order not found", changing ids | Fixed. Seed ids fixed; seller Accept → Packed → Shipped, buyer view, admin Refund all verified across instances |
| P0-3 assistant crash | Root cause: `useEffect(() => end.current?.scrollIntoView(...))` returned a value that React called as cleanup. Fixed (block body), plus an error boundary around the assistant and an app-level `error.tsx`. Verified: several messages, bundles and multi-part requests, desktop and mobile, zero page errors |
| P0-4 reverting changes | Fixed. Seller approval, payout, publish, onboarding all persist across instances; "Reset demo data" now clears only the visitor's own state and asks for confirmation |
| P1-1 noisy Hinglish search | Product noun must match (title/tags first, details only as fallback); "sasta/cheap/budget" are now a sort intent, not keywords. "sasta kurta" → only kurtas, cheapest first. Shared with the agent search |
| P1-2 multi-part assistant | Splits on aur/and/bhi/commas; one item per part with the budget shared fairly (gift + festive + chai within ₹2,000) |
| P1-3 anyone can become admin | Role cookies are HttpOnly (+Secure in prod). `DEMO_MODE=off` disables switching. Because demo state is per visitor, "admin" can only affect the visitor's own session |
| P1-4 seller PII in public API | `/api/cart/price` returns a minimal DTO (no bank/GSTIN/commission/joined); eval asserts it |
| P1-5 no My orders on mobile | Icon link in the header, plus a link on the order confirmation |
| P1-6 copilot wrong answer | "Which seller earned the most commission?" now answers per seller with a chart |
| P2 cart drawer blocks 2nd add | Replaced by a non-blocking toast with "View cart"; verified adding a second item immediately |
| P2 contrast | Accent darkened to `#c2410c`; status colours darkened; dimmed rows no longer use opacity. axe: clean |
| P2 aria-label mismatch / headings | Removed mismatching labels; H1 on seller and admin areas; empty-state heading fixed |
| P2 touch targets, FAB covering Add | Buttons/inputs/icons ≥44px on mobile; the floating assistant button is desktop-only, and a header icon opens it on phones |
| P2 duplicate price API calls | One debounced request per cart change, shared (checkout now makes 1 call, was 5) |
| P2 lazy images | First row eager, rest lazy |
| P2 security headers | CSP (Razorpay allow-listed), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS in production; `robots.txt` and `sitemap.xml` added |
| Not done (not requested) | Hindi toggle still partial (page content is, but several labels stay English); buyer-facing fee split is still shown (the brief asks for a visible split on every order); `/admin/analytics` still 404 |

**Honest limits of the cookie approach**: each browser has its own world (intended for a demo, not a shared marketplace); uploaded photos are not kept in the cookie (the generated illustration is used); about 11 KB of log fits (~100+ actions) and a full session asks the user to reset; agent `get_order_status` is best-effort across instances; the server-to-server Razorpay webhook has no visitor cookie, so with real keys the browser-side `/api/payments/verify` applies the capture. **Supabase remains the path to shared, durable state** (schema, RLS and SQL functions exist but the app does not read/write them yet).

## Simplification pass (owner feedback: minimalistic and easy to use)

## Simplification pass (owner feedback: minimalistic and easy to use)
- **Buying in 3 taps**: Add (card or product page) opens the cart with one Checkout button → one short delivery form (pre-filled) → one Pay button. Removed "Buy now", toast, per-seller summary cards, payment-method tabs.
- **Storefront**: home is now title + search + 5 category pills + one product grid (removed festive row, seller cards, 4 feature cards, badges, ratings, strike-through MRP). Product cards show image, name, seller, price, Add. Product page is image, name, price, one Add button, description; attributes and reviews are tucked into one collapsible. Filters collapsed into "Sort & filter". Header: logo, search (hidden on home where the hero has one), orders, view switcher, theme, cart. Language toggle moved to the footer.
- **Seller**: 4 tabs (Home, Products, Orders, Earnings) instead of a sidebar of 6. Home = one primary button ("Add a product from a photo") + 3 numbers + a low-stock list only when needed. Listing: photo → name, price, stock → **Publish** (description, Hindi, category, tags tucked under "More details"). Orders: 3 tabs and one action button per order that names the next step ("Accept", "Mark packed"…); the fee split stays visible as one line on every order.
- **Admin**: 4 tabs (Overview, Sellers, Orders, Money). Overview opens on "Needs your attention" where a pending shop or flagged listing is approved in one click; then 3 numbers, one chart, top sellers; copilot is collapsed. Commission editing moved into the Sellers list; payouts + reconciliation + webhook replay merged into Money (technical ledger detail collapsed). Moderation page merged into Overview; old `/admin/commission`, `/admin/payouts`, `/admin/products` redirect.
- **Finished from the brief**: Razorpay Checkout widget wired for when test keys are set (previously missing); copy tightened to plain labels.
- Everything above keeps the ledger, evals and build passing; no behaviour was removed, only moved or collapsed.

## What works (real code paths, runs with zero API keys)
- **Storefront**: home, category/search (filters, sort, price range held in the URL), product page (live stock badge that polls every 2 s, seller card, reviews, JSON-LD), seller store pages, multi-seller cart drawer + page grouped by seller, checkout with pincode check, order list and tracking, EN/हि interface toggle, dark/light, skeletons, empty states, keyboard/aria basics.
- **Checkout & payments**: one payment → one order group + one order per seller; atomic stock reservation (all-or-nothing), release on failure/expiry (10 min); mock Razorpay checkout that emits a **signed webhook through the real handler**; signature verification; idempotent capture (replay creates nothing; admin can replay from the Ledger page).
- **Commission engine + ledger**: integer paise, round-half-up per line, rate snapshotted on every order line, double-entry ledger (capture, refund with reversals, payout), reconciliation view reads ₹0.00. Visible **Order total / Platform fee / Seller payout** split on every order (customer, seller, admin views).
- **Seller portal**: onboarding (pending until approved; pending stores can't publish), product create/edit/archive, inventory with low-stock alerts and restock, fulfilment workflow with invalid transitions rejected, earnings statement that equals the ledger balance, new-order toast (polling), AI restock suggestion with Apply.
- **Admin**: seller approve/suspend/reinstate (suspended products leave the storefront immediately), product moderation queue, all-orders view with refund, per-seller commission (future orders only), simulated payouts, ledger + webhook log, KPI tiles, GMV trend, top sellers, category mix, fraud/anomaly queue with reasons, read-only copilot with charts, audit log (recorded; no UI), demo reset.
- **AI**: (a) photo-to-listing: upload (resized client-side) or sample photo → Zod-validated draft with EN + HI title/description, category, attributes, tags, price *hint*, confidence, retake prompt for unusable photos; seller edits and confirms; the model never sets the price. (b) Hinglish/Hindi/English hybrid search (keyword + concept ranker fused with RRF, typo tolerance, price parsing like "2000 tak", "why this matched") and a guarded shopping assistant that builds multi-seller carts from DB prices/stock, declines off-topic and manipulation attempts, shows its tool trace. (c) `/.well-known/ucp` discovery doc, MCP JSON-RPC endpoint (`search_products`, `get_product`, `create_cart`, `create_checkout`, `get_order_status`) and REST equivalents; server-side price authority, rate limits, token-scoped order status, human pay link.
- **Evals** (`scripts/evals.ts`): commission rounding, PRD refund scenario, ledger balance, webhook signature/replay, stock race on the last unit, failed-payment release, tenancy/transition rules, 18-query Hinglish golden set (hit-rate and p95 latency, well under 150 ms), agent price/stock/budget accuracy, prompt-injection and refusal sets, MCP flow, listing-schema validity.

## What is mocked or simulated (be upfront in the demo)
- **Data layer is a deterministic seed plus a per-visitor mutation log in a signed cookie** (`src/lib/store.ts`, `state.ts`): reliable on serverless without a DB, but private to each browser. Supabase has **schema, RLS and SQL functions** plus prepared clients, but the app does not read/write Supabase yet.
- **Auth is a role switcher** (cookie), not real auth. Server actions check the role cookie, but this is demo-grade, not a security boundary.
- **Razorpay**: mock checkout by default. Real order creation + signature verification are implemented (`src/lib/razorpay.ts`, `/api/payments/verify`) but never run against Razorpay. The Razorpay Checkout widget is wired in `PayPanel` but untested without keys. **Route transfers are simulated** and labelled as such.
- **AI**: without `ANTHROPIC_API_KEY`, photo-to-listing is a deterministic mock keyed on filename/hint/hash (not real vision). The live vision call is untested. The shopping assistant, copilot and anomaly rules are deterministic, not LLM-driven; "semantic" search uses an intent dictionary, not embeddings/pgvector.
- Courier tracking is internal status only; images are generated SVG illustrations; realtime features (stock badge, order updates, seller toast) use polling.
- `/.well-known/ucp` follows the UCP shape from memory of ucp.dev; it has **not** been validated against the official schema or conformance tests.

## Known gaps
- SQL migrations were not executed against Postgres; expect small fixes on first apply. No automated RLS test yet.
- No reviews submission, no variants selector (attributes only), no multiple image upload, audit log has no UI, refunds are full-seller-order only, gateway fees not modelled (PRD Q-08).
- Lighthouse/Core Web Vitals were not measured; no real-phone test was done.
- Browser end-to-end exists (`npm run e2e`, local two-server run) but has not been run against the live Vercel URL. Lighthouse not re-measured after this round.
- Orders seeded as relative dates; analytics charts cover the last 14 days.

## Next steps
1. Apply migrations to a Supabase project, implement a `SupabaseStore` behind the same function signatures, add two-vendor RLS tests, wire Supabase Auth.
2. Razorpay test keys: Checkout widget, webhook endpoint registration, Route linked accounts + transfers + reversals.
3. Real AI: vision model for listings with a 20-photo eval set and native-speaker Hindi review, embeddings + pgvector for search, LLM phrasing for the assistant behind the same guarded tools, promptfoo/CI.
4. Measure Lighthouse and CWV, tune; record the backup demo video.
5. Validate the UCP document against the official schema and run conformance tests.

## Commands
`npm run dev` · `npm run build` · `npm start` · `npm run evals` · `npm run lint` · `npm run e2e` · `npm run typecheck`
