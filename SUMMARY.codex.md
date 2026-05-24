Agent: Codex

Sprint: 32

Feature: S32-F2 - Case SLA timer contracts

Branch: main

Status: done

Commits this prompt:
- 7d3f7e9 - [codex] S32-F2: add case SLA timer contracts

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after implementation. It ran npm install, Prisma generate/db push, seed, lint, typecheck, 72 Vitest files / 387 tests, build, Playwright chromium install, and 22 Playwright e2e tests successfully.

DoD self-check: PASS

Timestamp: 2026-05-24T13:11:34.6126201-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added deterministic Case SLA policies and snapshots with injected-clock evaluation for target, due-soon, overdue, stopped-on-time, and stopped-overdue state.
- Added read-only Case service wrappers for single-case and list SLA snapshots without changing routes, schema fields, `crmClient` adapter signatures, or background infrastructure.
- Updated seeded Cases with controlled relative timestamps that produce stable SLA examples, and recorded the seed-only update in `docs/schema-changelog.md`.
- Added SLA calculation and seed coverage tests, including service wrapper coverage and seeded state diversity.
- Reconciled prompt context: local gate and commits support S32-F1 as done even though PLAN §4 still lists the row as queued; Gemini's historical Sprint 5 visual-snapshot summary does not match current PLAN §4 and was treated as stale.

### Next action

Run LOOP.md to begin S32-F3 - Service operations case UI.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; historical ownership zones were advisory)

CRM-CONTRACT.md honored: YES
