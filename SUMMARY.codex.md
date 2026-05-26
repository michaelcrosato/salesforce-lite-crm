Agent: Codex

Sprint: 42

Feature: S42-F1 - Campaign member removal and availability contracts

Branch: main

Status: done

Commits this prompt:
- e1bb7ec - [codex] S42-F1: add campaign member removal contracts

Gate status: PASS - Full `scripts/local-gate.ps1` passed after implementation, including `npm run lint`, `npm run typecheck`, `npm run test` (91 files / 462 tests), `npm run build`, and `npm run test:e2e` (23 passed).

DoD self-check: PASS

Timestamp: 2026-05-26T00:35:47.1828883-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added deterministic server-side campaign member availability contracts that exclude current contact/lead members, support trimmed search, bound returned candidates per type, and return stable counts plus sorted member rows.
- Added audited campaign member removal contracts that disconnect only current members, report skipped non-members idempotently, preserve existing add/list behavior, and record deterministic campaign audit metadata.
- Extended focused campaign member Vitest coverage for availability, removal audit evidence, validation, and compatibility with existing add/list behavior.

### Next action

Run LOOP.md to begin S42-F2 campaign ROI rollup summaries.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; implementation touched `lib/services/campaignMembers.ts` and `tests/api/campaignMembers.test.ts`)

CRM-CONTRACT.md honored: YES
