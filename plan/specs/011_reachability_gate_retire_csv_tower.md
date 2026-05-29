# 011 — Reachability gate + retire the dead CSV "operator tower" (TICKET006)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 5/5 · Feasibility 2/5 · Risk Med · Codebase Fit 5/5
- **Depends on:** none (but coordinate with 007's path-existence check)
- **Scope gate:** In-scope (deletes dead first-party code; **gated by a ratchet test** so nothing live is removed)
- **Related:** TICKET006, `docs/ai/csv-contract-assessment.md`, `lib/server/**` (apex `csvReleaseReadinessPackets.ts`)

## Description & Expected Impact
This is the dominant tech-debt mass. Of ~63 `lib/server` modules, ~21 form a **test-only "operator/release tower"** reachable from no `app/` or `components/` consumer, and ~34 are CSV contracts. `lib/server` is ~45k LOC versus ~9.6k LOC of actual `app/` routes — the read-only packet layer is ~4–5× the size of the product it serves, because the autonomous loop produces contract layers faster than UIs that consume them.

Land a **reachability gate** (a ratcheting test/script) that fails when a `lib/server` module is imported only by tests, then incrementally retire or merge the orphans. The gate makes the cleanup safe and prevents regrowth.

Impact: the largest possible reduction in maintenance surface, token cost, and confusion — and it stops the loop from re-accreting dead layers.

## Definition of Done & Acceptance Criteria
- [ ] A reachability checker (`scripts/check-reachability.mjs` or a vitest test) builds the import graph from `app/**` + `components/**` roots and flags `lib/server` modules reachable **only** from `tests/**`.
- [ ] The checker runs in CI and **ratchets**: the allowed-orphan count starts at today's measured number and may only decrease (a new orphan fails CI).
- [ ] An ordered **retirement plan** is recorded (which modules to delete vs merge vs keep-with-justification), grounded in `docs/ai/csv-contract-assessment.md`.
- [ ] At least the first batch of confirmed-dead modules (and their test-only tests) are removed, each in its own atomic commit, gate green at every step.
- [ ] `lib/server` LOC and orphan count both drop measurably; no live route/feature regresses.

## Implementation Approach
**Files to touch:** new `scripts/check-reachability.mjs`, `.github/workflows/ci.yml` (wire the gate), `lib/server/**` + matching `tests/api/**` (removals), `docs/ai/csv-contract-assessment.md` (retirement log).

- Build the graph by parsing static `import` specifiers (no runtime) starting from the live roots; mark transitively-reached modules; the complement within `lib/server` (reached only by tests) are orphans.
- Retire bottom-up from the apex (`csvReleaseReadinessPackets.ts`) downward; delete the module **and** its test together; re-run the full suite.
- Keep any module with a real (even if indirect) live consumer; justify keeps in the doc.

## Test Strategy
- **Gate test:** the reachability checker is itself the regression guard (ratchet down only).
- **Regression:** full `npm run test` (565→fewer as dead tests are removed) + `npm run build` + e2e green after each removal batch.
- This is a Large task — execute as a **series of small PRs**, never one mega-deletion.
