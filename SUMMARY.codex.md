Agent: Codex

Sprint: Sprint 55

Feature: S55-F2 - Capacity-aware routing simulation evaluator

Branch: main

Status: done

Commits this prompt: 907033b - [codex] S55-F2: add capacity-aware routing simulation

Gate status: PASS - baseline Phase 0 through `npm run build` passed before selection; post-implementation `scripts/local-gate.ps1` passed with `npm run test` at 114 files / 557 tests and `npm run test:e2e` at 49 tests.

DoD self-check: PASS

Timestamp: 2026-05-28T14:16:29.5926989-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from the single-agent root on `main`; the worktree was clean and the baseline gate through build was green before implementation.
- Reconciled coordination docs and selected S55-F2 as the next valid Codex unit; noted stale lower-authority Sprint 52 references in `docs/PROJECT-CONTROL.md` / `docs/ROADMAP.md` and stale S55-F1 queued status in `docs/FEATURE-BACKLOG.md`.
- Added optional capacity-window evaluation to `lib/server/routingSimulatorEvaluator.ts`, using S55-F1 validation contracts to apply daily caps, blackout dates, outside-window checks, batch overflow, and capacity-blocked outcomes without changing live routing or assignment reason constants.
- Passed capacity summaries through `lib/server/routingSimulatorReviewPackets.ts` for later operator-surface wiring while preserving unchanged behavior when no capacity windows are supplied.
- Added focused Vitest coverage for default no-capacity behavior, daily-cap overflow, capacity blocking, blackout/outside-window checks, review-packet pass-through, and no CRM write side effects.
- Verified the implementation with focused routing simulator Vitest, `npm run typecheck`, `npm run lint`, and the full `scripts/local-gate.ps1`.

### Next action

Run LOOP.md to begin S55-F3, capacity window operator surface.

### Scope confirmation

No cross-ownership edits: YES - single-agent root mode; implementation was scoped to server evaluator/review-packet contracts and API tests plus Codex report files.

CRM-CONTRACT.md honored: YES
