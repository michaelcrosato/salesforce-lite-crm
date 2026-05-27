Agent: Codex

Sprint: 47

Feature: S47-F2 — Approval review packets

Branch: main

Status: done

Commits this prompt:
- 34cba40 — [codex] S47-F2: add approval review packets

Gate status: PASS - `powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1` passed: npm install, env check, Prisma generate/db push, seed, lint, typecheck, Vitest (100 files / 505 tests), build, Playwright chromium install, and e2e (39 tests).

DoD self-check: PASS

Timestamp: 2026-05-26T17:02:57.0787690-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Completed S47-F2 by adding `lib/server/approvalReviewPackets.ts`, a deterministic no-write approval review packet layer that classifies supported, blocked, unknown, malformed, read-only, and missing-evidence proposals against the S47-F1 approval policy registry.
- Added `tests/api/approval-review-packets.test.ts` covering packet metadata, sample proposal audit output, approval-needed summaries, not-needed summaries, blocked subjects, malformed/unknown proposals, missing evidence, batch rollups, and no-write/no-execution/no-approval-persistence flags.
- Verified the focused test, typecheck/lint, and the full local gate with Playwright e2e.

### Next action

Run LOOP.md for S47-F3 — Approval readiness operator surface.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; implementation was limited to server/test/report files)

CRM-CONTRACT.md honored:  YES
