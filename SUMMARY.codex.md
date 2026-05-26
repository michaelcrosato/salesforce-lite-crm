Agent: Codex

Sprint: 45

Feature: S45-F1 — AI action intent registry

Branch: main

Status: done

Commits this prompt:
- f9e36bd - [codex] S45-F1: add action intent registry

Gate status: PASS - Pre-flight baseline passed through `npm run build`. Post-implementation targeted checks passed: `npm run test -- tests/ai-action-intent-registry.test.ts`, `npm run lint`, and `npm run typecheck`. Full local gate passed via `scripts/local-gate.ps1`: npm install, Prisma generate/db push, seed, lint, typecheck, Vitest (94 files / 476 tests), build, Playwright chromium install, and e2e (35 tests).

DoD self-check: PASS

Timestamp: 2026-05-26T08:55:57.6161853-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/ai/actionIntentRegistry.ts`, a deterministic metadata-only registry for supported and deferred AI action intents with schema refs, approval and audit expectations, CRM object scope, no-write flags, forbidden capabilities, lookup helpers, and an audit helper.
- Added `tests/ai-action-intent-registry.test.ts` covering stable supported/deferred IDs, strict proposal/review schemas, non-goal deferrals, lookup helpers, no-write safety, excluded-route guardrails, and registry audit output.
- Committed implementation work atomically and verified the full local gate remains green.

### Discovered this prompt

- `docs/PROJECT-CONTROL.md`, `docs/ROADMAP.md`, and README roadmap prose still contain older Sprint 33 "next target" language. PLAN.md §4 is higher authority and now queues Sprint 45; no doc fix was bundled into S45-F1.
- Other agents' SUMMARY/BLOCKERS files are historical branch snapshots with no active blockers impacting this single-agent root run.

### Next action

Run LOOP.md to begin S45-F2 — AI action review packets.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; historical zones were advisory)

CRM-CONTRACT.md honored: YES
