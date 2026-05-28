Agent: Codex

Sprint: Sprint 52

Feature: S52-F2 - Routing simulator read-only evaluator

Branch: main

Status: done

Commits this prompt: dbc3fbd - [codex] S52-F2: add routing simulator evaluator

Gate status: PASS - Phase 0 baseline passed through `npm install`, Prisma generate/db push, seed, lint, typecheck, `npm run test` (109 files / 539 tests), and build. Implementation verification passed with `npm run test -- tests/api/routing-simulator-evaluator.test.ts`, `npm run typecheck`, `npm run lint`, and the full `scripts/local-gate.ps1` sequence including 110 Vitest files / 541 tests, build, Playwright Chromium install, and 45 e2e tests.

DoD self-check: PASS

Timestamp: 2026-05-27T22:25:59.9368290-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from the single-agent root worktree on `main` and confirmed the baseline gate was green before selecting work.
- Reconciled `PLAN.md`, `CRM-CONTRACT.md`, README, agent SUMMARY/BLOCKERS files, referenced docs/prompts, and recent git history. `PLAN.md` still lists S52-F1 and S52-F2 as queued, while Codex report/commit evidence now shows both features are done with green local gates; SPRINT-ROLLOVER.md should do the planning update.
- Implemented `lib/server/routingSimulatorEvaluator.ts` with a deterministic read-only evaluator for hypothetical consumer leads, including area matching, active order filtering, current-month delivery counts, pace-gap ranking, selected-order/blocker summaries, step traces, and no-write guardrails.
- Added `tests/api/routing-simulator-evaluator.test.ts` covering routed, no-area, no-active-order, and all-orders-at-quota outcomes plus a no-write count assertion.
- Verified S52-F2 with focused tests, typecheck, lint, and the full local gate script.

### Next action

Run SPRINT-ROLLOVER.md to mark Sprint 52 complete and queue the next Codex track.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
