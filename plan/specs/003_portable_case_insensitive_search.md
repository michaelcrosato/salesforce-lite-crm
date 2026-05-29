# 003 — Make global search case-folding explicit & provider-portable

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** In-scope
- **Related:** `lib/services/search.ts:31` (`contains` helper), `components/command-palette.tsx`, `schema.postgres.prisma`

## Description & Expected Impact
`globalSearch` (`lib/services/search.ts`) builds every filter through a `contains(query)` helper (line 31) that omits Prisma's `mode`. On the **SQLite default** this happens to work for ASCII because SQLite `LIKE` is case-insensitive by default — but the behavior is **implicit and fragile**:
1. It is **not** case-folded for non-ASCII/Unicode even on SQLite.
2. It **breaks on the Postgres variant** (`schema.postgres.prisma`): Prisma `contains` → case-sensitive `LIKE`, so cross-provider parity testing or any future Postgres run silently regresses search.
3. There is **no regression test** pinning case-insensitive behavior, so a refactor could break it unnoticed.

Make the intent explicit and portable, and lock it with a test. This is the cross-entity command-palette surface (Ctrl/Cmd+K) — the most-used search in the product.

## Definition of Done & Acceptance Criteria
- [ ] Searching a mixed-case term matches records regardless of case on SQLite (e.g. `"ACME"` finds seeded `"Acme …"`), proven by a new unit test.
- [ ] Behavior is provider-portable: when `DATABASE_URL` is Postgres, filters use `mode: "insensitive"`; on SQLite they must **not** pass `mode` (the better-sqlite3 adapter rejects it). Branch on provider via a single helper.
- [ ] The `contains` helper is the single point of change; all 7 entity queries inherit it.
- [ ] `npm run test` + `npm run build` green.

## Implementation Approach
**Files to touch:** `lib/services/search.ts` (upgrade the `contains` helper to a provider-aware filter builder), optionally `lib/prisma.ts` (export a `databaseProvider()` helper deriving `"sqlite" | "postgres"` from `DATABASE_URL`), `tests/api/search.test.ts` (new or extend).

- Add `databaseProvider()` returning the active provider (same `postgres://`/`postgresql://` detection used by `createPrismaClient`).
- In `contains`, return `{ contains: query, mode: "insensitive" }` only for Postgres; `{ contains: query }` for SQLite.
- Keep `globalSearch`'s `take: 10` fan-out and `ROUTE_REGISTRY` mapping unchanged.

## Test Strategy
- **Unit (vitest):** seed mixed-case fixtures; assert `globalSearch("ACME")` returns the `"Acme"` account, `globalSearch("john")` finds `"John"` contact, etc. Runs under the existing serial `--maxWorkers=1` shared DB.
- **Regression:** ensure empty/whitespace term still returns `emptyResults()`.
