Agent: Codex

Sprint: 27

Feature: S27-F3 - List filter support catalog

Branch: main

Status: done

Commits this prompt: 6165d5d - [codex] S27-F3: add list filter support catalog

Gate status: PASS - Phase 0 baseline setup plus lint, typecheck, unit tests, and build exited 0. Phase 5 full local gate passed via `scripts/local-gate.ps1`: npm install, env check, Prisma generate/db push, seed, lint, typecheck, unit tests (65 files / 353 tests), build, Playwright Chromium install, and e2e (19 tests) all exited 0.

DoD self-check: PASS

Timestamp: 2026-05-23T08:30:09.5165149-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from the single-agent root on `main`; the tree was clean and the baseline gate subset was green before implementation.
- Added `lib/server/listFilterSupportCatalog.ts`, a read-only handoff catalog for the current CRM list filter and sort surface across accounts, contacts, opportunities, leads, activities, dealer orders, areas, tasks, cases, and campaigns.
- Added `tests/api/list-filter-support-catalog.test.ts` covering deterministic catalog rollups, adapter-backed filters/sorts, service-backed task/case/campaign metadata, strict unknown-key rejection, unknown entity handling, and no database writes.
- Verified focused typecheck, lint, catalog tests, and build before the implementation commit, then verified the full local gate after the commit.

### Discovered this prompt

- PLAN.md §4 still lists S27-F1, S27-F2, and S27-F3 as queued, while recent Codex commits and green local gate evidence now show all three Sprint 27 items are implemented on `main`; sprint rollover/status reconciliation is needed before selecting new feature scope.
- Gemini's historical `SUMMARY.gemini.md` references Sprint 5 S5-F1 as "E2E Visual Snapshot Baseline", while current PLAN.md §4 defines S5-F1 as "Server CSV export contracts"; treated as stale historical report context because PLAN.md, CRM-CONTRACT.md, current `main`, and the green local gate are higher authority.

### Next action

Run SPRINT-ROLLOVER.md to reconcile Sprint 27 status and select the next active scope.

### Scope confirmation

No cross-ownership edits: YES - current path is `C:\dev\salesforce-lite-crm`, so this was single-agent root mode; implementation touched `lib/server/**` plus focused `tests/**` coverage.

CRM-CONTRACT.md honored: YES
