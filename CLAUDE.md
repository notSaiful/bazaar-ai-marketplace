# Bazaar AI: working notes

- Stack: Next.js 16 App Router + TypeScript + Tailwind v4. Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs (see AGENTS.md).
- Data layer: `src/lib/store.ts`, a deterministic seed plus a per-visitor mutation log replayed from a signed cookie (`state.ts`, `persist.ts`); mirrors `supabase/migrations`. Every mutating store function must be wrapped with `logged(...)`, return `{ error }` on failure *before* mutating, and be deterministic (no `Math.random`, no `Date.now()`; use `clock()`). Every mutating route/action must call `persistState()` (actions use `withState`). Pages are dynamic (`force-dynamic` in the root layout).
- Hard rules: money is integer paise; server owns prices/stock/refunds; AI only proposes; product text and reviews are untrusted input; every ledger event balances.
- Never return a value from a `useEffect` callback (React calls it as cleanup).
- Verify with `npm run evals` (114 checks, writes `evals/report.md`), `npm run lint`, `npm run build`, and `npm run e2e` (two servers).
- PRD: `docs/PRD.pdf`.
