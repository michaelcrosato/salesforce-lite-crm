# 012 — Parallel-safe tests: per-worker SQLite isolation (TICKET007)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 2/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** none
- **Scope gate:** In-scope (test infra; **`prisma/seed.ts` is sacred** — do not change seed logic, only how tests provision DBs)
- **Related:** TICKET007, `vitest.config.ts`, `package.json` test script, `lib/prisma.ts`

## Description & Expected Impact
Tests run `vitest run --maxWorkers=1` because all 116 files share a single `prisma/dev.db`; parallel workers would race on it. As the suite grows (565 tests, ~46s serial today), serial execution becomes the bottleneck for the autonomous loop's gate. Give each worker its own SQLite database so `maxWorkers` can rise.

Impact: faster gate → faster overnight iterations; removes a known scaling ceiling.

## Definition of Done & Acceptance Criteria
- [ ] Each Vitest worker uses an **isolated** database (e.g. `file:./prisma/.test-dbs/worker-${VITEST_POOL_ID}.db` or `:memory:`), created + `prisma db push`'d in a global/setup hook.
- [ ] `--maxWorkers=1` is removed (or raised) and the **full suite passes repeatedly** (run 3×) with no flakiness.
- [ ] Wall-clock test time drops meaningfully versus the 46s serial baseline.
- [ ] Determinism preserved (routing/forecast tests still produce identical output).
- [ ] Test DB files are gitignored; no artifacts committed.

## Implementation Approach
**Files to touch:** `vitest.config.ts` (pool config + `globalSetup`/`setupFiles`), new `tests/setup/db.ts`, `package.json` (edit the existing `test` script — allowed; do **not** add a new script), `.gitignore`.

- In setup, derive a per-worker `DATABASE_URL`, ensure the DB exists + schema is pushed, optionally seed via the existing seed path (reuse, don't modify, `prisma/seed.ts`).
- Confirm `lib/prisma.ts` honors the per-worker `DATABASE_URL` (it already branches on it).
- If `:memory:` is used, ensure each worker holds a single connection for the whole run (better-sqlite3 in-memory is per-connection).

## Test Strategy
- **Meta-test:** run the suite at `maxWorkers=4` three times; assert green + stable timing.
- **Determinism check:** diff routing/forecast test outputs against the serial baseline.
- Land behind a go/no-go: if isolation proves flaky, document findings in TICKET007 and revert to serial rather than ship flaky parallelism.
