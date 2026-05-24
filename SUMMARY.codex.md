Agent: Codex

Sprint: 32

Feature: S32-F1 - Case queue assignment foundation

Branch: main

Status: done

Commits this prompt:
- 7083598 - [codex] S32-F1: add case queue assignment foundation

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after implementation. It ran npm install, Prisma generate/db push, seed, lint, typecheck, 71 Vitest files / 381 tests, build, Playwright chromium install, and 22 Playwright e2e tests successfully.

DoD self-check: PASS

Timestamp: 2026-05-24T12:08:44.4545253-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added deterministic Case queue assignment metadata with `queueKey` and `queueReason` fields in SQLite and Postgres Prisma schemas.
- Added the shared Case queue key catalog and service helper for explicit queues, urgent priority routing, keyword routing, linked-customer fallback, and default support routing.
- Wired Case create/update flows to assign queues deterministically, preserve explicit queues, and include queue metadata plus previous queue evidence in audit events.
- Updated seed data to populate queue assignments and expanded service/action/seed integrity coverage for queue creation, explicit preservation, reassignment, and seeded queue diversity.
- Recorded the schema/seed change in `docs/schema-changelog.md`.

### Next action

Run LOOP.md to begin S32-F2 - Case SLA timer contracts.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; historical ownership zones were advisory)

CRM-CONTRACT.md honored: YES
