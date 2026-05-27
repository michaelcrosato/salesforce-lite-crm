Agent: Codex

Sprint: Sprint 51

Feature: S51-F1 — Dashboard card definition contracts

Branch: main

Status: done

Commits this prompt: c136561 — [codex] S51-F1: add dashboard card definition contracts

Gate status: PASS — Focused test passed with `npx vitest run tests/api/dashboard-card-definitions.test.ts --maxWorkers=1`; full local gate passed with `powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1` including lint, typecheck, 107 Vitest files / 531 tests, build, Playwright Chromium install, and 44 e2e tests.

DoD self-check: PASS

Timestamp: 2026-05-27T14:54:50.5592004-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from the single-agent root worktree on `main` and confirmed the baseline gate through build was green before selecting work.
- Implemented `lib/server/dashboardCardDefinitions.ts` with saved-report-backed dashboard-card metadata, placement/size/visualization contracts, preview-limit validation, read/write guardrails, and no route/UI/schema/provider behavior.
- Added `tests/api/dashboard-card-definitions.test.ts` covering deterministic catalog metadata, normalized card defaults, invalid-card rejection, and no database/audit writes during validation.
- Verified S51-F1 with the focused test, lint, typecheck, and the full `scripts/local-gate.ps1` sequence.

### Next action

Run LOOP.md to begin S51-F2 — Dashboard card preview runner.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
