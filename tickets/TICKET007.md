# TICKET007 — investigate parallel-safe tests (drop `--maxWorkers=1`)

- **Status:** Open
- **Priority:** Low (investigation-first; do not change test infra blindly)
- **Depends on:** none. Context: `docs/ai/NEXT-LEVEL.md` Lever A3.

## Goal

Determine whether the Vitest suite can run with `maxWorkers>1` safely, to bound
the loop's dominant inner-loop cost as the suite grows. The suite runs on every
`agent:check` and every Stop hook, fully serialized, on 565 tests today.

## Context

`package.json` pins `"test": "vitest run --maxWorkers=1"`. The almost-certain
reason is a **shared SQLite database file**: parallel workers would race on the
same `dev.db`/Prisma datasource. Confirm the root cause before touching
anything — serialized execution may be load-bearing.

## Scope

- In: (1) confirm *why* `--maxWorkers=1` is set (search history/comments, try
  removing it locally and observe failures); (2) assess whether per-worker DB
  isolation is feasible (e.g., `VITEST_WORKER_ID`-suffixed SQLite file or
  in-memory DB per worker via the existing better-sqlite3 adapter); (3) write
  findings + a go/no-go recommendation into this ticket or a short note.
- Out: actually flipping the default without a green full suite under
  parallelism; any schema change; new dependencies.

## Likely files

`package.json` (the `test` script), `vitest.config.ts`, the test DB
bootstrap (`scripts/ensure-sqlite-db.mjs`, any `tests/**/setup*` or per-test
Prisma client wiring), `prisma/schema.prisma` datasource (read-only — sacred per
CLAUDE.md §8; do not edit).

## Steps

1. Grep tests + setup for how the Prisma client / DB file is obtained per test.
2. Locally run `vitest run --maxWorkers=50%` and record failures (expect DB
   races). Do **not** commit this change yet.
3. Prototype per-worker DB isolation in a branch; re-run; measure wall-clock
   delta vs the serialized baseline.
4. Record a go/no-go with the measured numbers. If go, the flip + isolation land
   together in a follow-up; if no-go, document why serialized is required.

## Acceptance criteria

- [ ] Root cause of `--maxWorkers=1` documented with evidence.
- [ ] Feasibility verdict (go/no-go) recorded with a measured runtime comparison.
- [ ] If no-go: the constraint is written down so no one re-litigates it.
- [ ] No infra change committed unless the **full** suite is green in parallel.

## Commands

```powershell
npm run test                       # serialized baseline (record time)
npx vitest run --maxWorkers=50%    # experiment only — do not commit if red
```

## Risks

Parallel DB access can produce *flaky* green/red, which is worse than slow-but-
deterministic. The bar for flipping the default is a **repeatably** green full
suite under parallelism, not a single lucky run.
