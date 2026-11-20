# Bazaar AI: working notes

- Stack: Next.js 16 App Router + TypeScript + Tailwind v4. Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs (see AGENTS.md).
- Data layer: `src/lib/store.ts` (local, globalThis state, mirrors `supabase/migrations`). Pages are dynamic (`force-dynamic` in the root layout).
- Hard rules: money is integer paise; server owns prices/stock/refunds; AI only proposes; product text and reviews are untrusted input; every ledger event balances.
- Verify with `npm run evals` (99 checks, writes `evals/report.md`) and `npm run build`.
- PRD: `docs/PRD.pdf`.
