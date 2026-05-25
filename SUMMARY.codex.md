Agent: Codex

Sprint: 38

Feature: S38-F1 - Workflow rule example contracts

Branch: main

Status: done

Commits this prompt:
- 5cd532a - [codex] S38-F1: add workflow rule example contracts

Gate status: PASS - Phase 0 baseline and Phase 5 verification passed the full local gate via `scripts/local-gate.ps1`: install, Prisma generate/db push, seed, lint, typecheck, `npm run test` (84 files / 438 tests), build, Playwright Chromium install, and `npm run test:e2e` (22 passed). Focused pre-commit checks also passed `npm run test -- tests/api/workflow-rule-examples.test.ts`, `npm run lint`, and `npm run typecheck`.

DoD self-check: PASS

Timestamp: 2026-05-25T10:05:20.2734252-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/server/workflowRuleExamples.ts` with deterministic, catalog-backed workflow-rule example contracts for every supported workflow entity, including sample draft rules, fixture metadata, coverage summaries, and explicit no-write/no-executor safety flags.
- Added `tests/api/workflow-rule-examples.test.ts` to verify example coverage across supported entities/triggers/conditions/actions, review-packet compatibility against synthetic fixtures, no CRM/audit/workflow writes, and exclusion of unsupported non-goal entities/routes/actions.
- Reconciled stale historical side-branch reports against current `PLAN.md` Sprint 38 scope and green local gate evidence; no active Codex blockers or cross-agent blockers affect S38-F1.

### Next action

Run LOOP.md to begin S38-F2 - Workflow dry-run operator UI.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
