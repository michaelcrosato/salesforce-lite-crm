# BACKLOG — adjacent ideas surfaced during execution

Out-of-scope-but-worth-doing items found while implementing specs. Each entry: what, why, where it came from. Promote to a numbered spec (or fold into a related one) before acting — do **not** action these inline during feature work (CLAUDE.md §13).

## Test hardening

- **Make the case-SLA seed test deterministic.** `tests/seed-integrity.test.ts` → `seeded cases cover case SLA states` compares wall-clock `new Date()` against case ages that `prisma/seed.ts` anchors to *seed-time* `new Date()` (`caseSlaSeedNow`). On a stale shared SQLite baseline the `due_soon` case ages into `overdue`, so the suite fails until the DB is re-seeded. It's a latent time-bomb: green right after `npm run seed`, red hours later.
  - *Why it matters:* any agent that runs `npm run test` against an old DB hits a spurious red gate (cost me a full investigation during spec 005).
  - *Options:* (a) a `beforeAll` that re-seeds, or asserts the baseline is fresh; (b) have the seed persist its `caseSlaSeedNow` anchor and have the test read it instead of `new Date()`; (c) inject a fixed clock into the seeded case ages. Keep the seed's demo freshness (`new Date()` drives "this month" KPIs) — fix the **test's** clock assumption, not the seed's.
  - *Source:* spec 005 verification, 2026-05-29.

## Observability

- **Extend `logActionError` into `app/reports/actions.ts`.** Spec 004 centralized error logging across the `ActionResult`-returning CRUD actions, but `reports/actions.ts` returns bespoke result unions (e.g. `BulkActionExecutionActionResult`, `SavedReportManagementActionResult`) from ~15 preview/packet/execution builders. Most use `catch {}` with **no error binding**, so the underlying failure is discarded entirely — the exact overnight blind spot spec 004 set out to close, just in a module the spec's literal wording ("the masked `ActionResult`") didn't cover.
  - *Why it matters:* bulk-execution and CSV-apply operator actions mutate data; a discarded throw there is invisible after the fact.
  - *How:* bind `catch (error)` and call `logActionError(error, { action, entity })` at the top of each catch; return values stay byte-identical. Mechanical but ~15 sites — scope as a small follow-up so it stays atomic.
  - *Source:* spec 004 implementation, 2026-05-29.

## Refactors / dedup

- **Dedup the calendar-date split/UTC helpers across `lib/server`.** `noUncheckedIndexedAccess` work touched near-identical `[year, month, day]` split + guard + `Date.UTC` logic in `pacingSnapshotContracts.ts`, `pacingSnapshotBuilder.ts`, `dealerCapacityWindowContracts.ts`, and `routingSimulatorEvaluator.ts`. A single shared `parseCalendarDate`/`calendarDateUtcMs` helper would remove the repetition and the repeated undefined-guards.
  - *Why it matters:* four copies of the same parsing invariant drift independently.
  - *Caveat:* a shared helper crosses several `lib/server` packet modules — scope as its own refactor spec, with the existing contract tests pinning behavior first.
  - *Source:* spec 005 fallout triage, 2026-05-29.

## Transaction Safety

- **Transactional Audit Logging for Accounts Actions.** In `app/accounts/actions.ts`, lines 73-81 (`createAccountAction`) and 146-160 (`updateAccountAction`) call `recordAuditEvent` *outside* of the Prisma `$transaction` block, whereas `contacts`, `deals`, and `leads` actions correctly wrap both database mutations and audit logging in a single `$transaction`. If the audit write fails or if the mutation fails, the database state drifts (i.e. an account could be modified without a corresponding audit trail, or vice versa).
  - *Why it matters:* Audit logging must be reliable and atomic. Unwrapped writes violate this integrity guarantee.
  - *How:* Wrap the database mutation and `recordAuditEvent` in a `prisma.$transaction` in both the create and update actions.
  - *Source:* Codebase audit, 2026-05-30.
