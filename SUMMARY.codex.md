Agent: Codex

Sprint: 35

Feature: S35-F1 - Deterministic AI prompt registry

Branch: main

Status: done

Commits this prompt:
- 688830b - [codex] S35-F1: add deterministic AI prompt registry

Gate status: PASS - Phase 0 baseline passed install, env bootstrap, Prisma generate/db push, seed, lint, typecheck, unit tests, and build on clean `main`; post-implementation `scripts/local-gate.ps1` passed install, Prisma generate/db push, seed, lint, typecheck, unit tests (75 files / 400 tests), build, Playwright chromium install, and e2e (22 passed).

DoD self-check: PASS

Timestamp: 2026-05-24T23:32:23.2133623-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/ai/promptRegistry.ts` with stable `v1` registry entries for activity note summaries, dashboard analyst actions, and case knowledge suggestions.
- Registered each deterministic AI-style surface with owner, kind, source export, TypeScript input/output schema references, route scope, and explicit no-provider/no-network/no-write/no-RAG/no-secrets safety flags.
- Exported the existing dashboard analyst input shape as `AnalystPanelInput` so the registry points at a named source contract without changing runtime behavior.
- Added `tests/ai-prompt-registry.test.ts` to verify registry ordering, unique IDs, lookup behavior, schema references, owner filtering, and safety flags.

### Discovered this prompt

- Other-agent SUMMARY/BLOCKERS files remain historical and disagree with current PLAN section 4: Claude still reports Sprint 4 active, Grok reports Sprint 4 continuous component polish, and Gemini reports a visual Sprint 5 queue that is not the current PLAN section 4 Sprint 35 track. Current repo-local authority is the green local gate plus PLAN section 4 Sprint 35.

### Next action

Run LOOP.md to begin S35-F2 - Structured deterministic output contracts.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
