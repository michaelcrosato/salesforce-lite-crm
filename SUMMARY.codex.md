Agent: Codex

Sprint: 37

Feature: S37-F2 — Workflow dry-run evaluator

Branch: main

Status: done

Commits this prompt:
- e718131 — [codex] S37-F2: add workflow dry-run evaluator

Gate status: PASS — Phase 0 baseline and Phase 5 verification both passed the full local gate via `scripts/local-gate.ps1`: install, Prisma generate/db push, seed, lint, typecheck, `npm run test` (82 files / 431 tests), build, Playwright Chromium install, and `npm run test:e2e` (22 passed).

DoD self-check: PASS

Timestamp: 2026-05-25T07:32:15.8207773-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/server/workflowRuleDryRun.ts`, a read-only workflow-rule dry-run evaluator that validates draft rules against the S37-F1 catalog, scans bounded CRM candidates deterministically, and returns matched record references plus summary-only proposed actions.
- Added `tests/api/workflow-rule-dry-run.test.ts` coverage for invalid actions/targets, empty matches, match limits, deterministic ordering, and no database-write side effects.
- Verified S37-F2 with focused tests, lint, typecheck, the required business-logic subset, and the full local gate.

### Discovered this prompt

- `PLAN.md` §4 still lists S37-F1 as queued, but `main` contains `040e042` and the previous Codex report cites a green full local gate for S37-F1; per §2, this run treated S37-F2 as the next valid unit.
- Gemini's root report still references a Sprint 5 queue that is not the current active §4 sprint; it did not block Codex's Sprint 37 work.

### Next action

Run LOOP.md to begin S37-F3 — Workflow review packets.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
