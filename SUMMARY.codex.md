Agent: Codex

Sprint: 40

Feature: S40-F1 - CSV contact import apply capability matrix

Branch: main

Status: done

Commits this prompt:
- 84ab54b - [codex] S40-F1: add CSV import apply capabilities

Gate status: PASS - `scripts/local-gate.ps1` completed npm install, env bootstrap, Prisma generate/db push, seed, lint, typecheck, `npm run test` (88 files / 450 tests), build, Playwright Chromium install, and `npm run test:e2e` (22 passed).

DoD self-check: PASS

Timestamp: 2026-05-25T18:24:52.0369125-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/server/csvImportApplyCapabilities.ts`, a deterministic metadata-only CSV contact import apply capability matrix that maps existing import preflight row actions to contact-create eligibility and explicit blocked reasons for review/blocked rows, lead apply/routing, update/upsert, duplicate merge, file storage, external services, and Salesforce integration.
- Added `tests/api/csv-import-apply-capabilities.test.ts` coverage for root matrix metadata, contact `create_candidate` eligibility, lead/non-goal exclusions, strict input handling, route guardrails, and unchanged contact/lead/audit counts.
- Reconciled current coordination state: `PLAN.md` and `docs/FEATURE-BACKLOG.md` queue S40-F1/S40-F2/S40-F3; older Claude/Grok/Gemini reports remain historical and include stale Sprint 4/5 references that do not change the active Codex queue.

### Next action

Run LOOP.md to begin S40-F2 - CSV contact import manual apply executor.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; implementation touched `lib/server/` and focused Vitest coverage in `tests/api/`)

CRM-CONTRACT.md honored: YES
