Agent: Codex

Sprint: 37

Feature: S37-F1 — Workflow rule catalog

Branch: main

Status: done

Commits this prompt:
- 040e042 — [codex] S37-F1: add workflow rule catalog

Gate status: PASS — Phase 0 baseline passed `npm install`, `.env` check, `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run lint`, `npm run typecheck`, `npm run test` (80 files / 422 tests), and `npm run build`; Phase 5 full local gate via `scripts/local-gate.ps1` passed install, Prisma generate/db push, seed, lint, typecheck, `npm run test` (81 files / 427 tests), build, Playwright Chromium install, and `npm run test:e2e` (22 passed).

DoD self-check: PASS

Timestamp: 2026-05-25T05:54:34.5758144-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/server/workflowRuleCatalog.ts`, a typed deterministic workflow-rule catalog for draft planning over supported current CRM objects, triggers, condition families, and descriptor-only actions.
- Added `tests/api/workflow-rule-catalog.test.ts` coverage for catalog metadata, object/action matrix, CRM constant-backed condition/action targets, strict input handling, non-goal exclusions, and no-write behavior.
- Verified the new server contract surface with the full local gate through unit, build, and e2e.

### Next action

Run LOOP.md to begin S37-F2 — Workflow dry-run evaluator.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
