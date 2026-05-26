Agent: Codex

Sprint: 47

Feature: S47-F1 — Approval policy registry

Branch: main

Status: done

Commits this prompt:
- a34caed — [codex] S47-F1: add approval policy registry

Gate status: PASS - `powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1` passed: npm install, env check, Prisma generate/db push, seed, lint, typecheck, Vitest (99 files / 499 tests), build, Playwright chromium install, and e2e (39 tests).

DoD self-check: PASS

Timestamp: 2026-05-26T15:46:52.0760928-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Completed S47-F1 by adding `lib/server/approvalPolicyRegistry.ts`, a deterministic metadata-only approval policy registry for supported and blocked CRM / AI-action approval subject classes.
- Added `tests/api/approval-policy-registry.test.ts` covering stable registry metadata, risk levels, reviewer labels, evidence requirements, audit expectations, blocked capabilities, no-write/no-execution flags, lookup helpers, and registry audit output.
- Verified the focused test, the business-logic subset, and the full local gate with Playwright e2e.

### Next action

Run LOOP.md for S47-F2 — Approval review packets.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; implementation was limited to server/test/report files)

CRM-CONTRACT.md honored:  YES
