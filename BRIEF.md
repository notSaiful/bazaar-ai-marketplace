# Build brief: Multi-Vendor Marketplace prototype (AI Proficiency Hackathon)

Full requirements are in ./PRD.pdf (read it first; use `pdftotext` if available, otherwise read it directly). Goal: a WORKING, demo-ready, beautiful prototype that wins on problem solving, UI/UX, innovation, performance and AI proficiency.

## Stack
- Next.js (App Router, TypeScript) + Tailwind + shadcn/ui, deploy-ready for Vercel.
- Data: design schema for Supabase Postgres (with RLS SQL in /supabase/migrations), BUT the prototype must run locally with ZERO API keys: implement a data-access layer with a local fallback (seeded in-memory/JSON or SQLite) used when Supabase env vars are absent.
- Payments: Razorpay Checkout + Route (test mode) design; when keys are absent, use a realistic mock checkout that still writes the commission ledger (platform commission + per-seller payable, refunds reverse correctly).
- AI: provider-agnostic helper; when no API key, return deterministic mocked AI output so the demo never breaks.

## Must work end to end
1. Customer storefront: home, category/search, product page, multi-seller cart, checkout, order tracking.
2. Seller portal: onboarding, product CRUD, inventory, orders, fulfilment status updates, earnings/payouts view.
3. Admin dashboard: sellers approval, products moderation, orders, commission settings, payouts, analytics charts.
4. Commission engine + ledger with a visible split on every order.
5. Hero AI features: (a) photo-to-listing (upload image -> title, description in English+Hindi, category, attributes, price hint; seller reviews before publish), (b) Hinglish-aware smart search + AI shopping assistant chat that can build a multi-seller cart (prices/stock from DB only), (c) agent-ready endpoint: /.well-known/ucp JSON + simple REST/MCP-style tools for search and checkout.
6. Rich seeded demo data: ~5 sellers, ~40 products with images (use placeholder image services or generated SVGs), sample orders.
7. Role switcher for demo (customer / seller / admin) without real auth friction; Supabase auth wiring prepared.

## Quality bar
Premium, modern UI (consistent design system, dark/light, responsive, skeletons, empty states). Lighthouse-friendly. `npm run build` must pass with no errors. Write README.md with setup, env vars, demo script. Commit to git in logical steps.

Work autonomously until the full prototype builds and runs. At the end, write PROGRESS.md summarising what works, what is mocked, and next steps.

## UPDATE from Saiful (owner)
Feedback on the live preview: "It looks good, but keep it MINIMALISTIC and EASY TO USE." Simplify: fewer elements per screen, generous whitespace, clear single primary action per page, plain labels, shorter flows (fewer clicks to buy, list a product, approve a seller). Remove clutter and decorative noise; keep the polish.
