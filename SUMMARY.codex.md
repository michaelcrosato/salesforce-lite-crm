Agent: Codex

Sprint: 31

Feature: S31-F1 - Bulk list selection contracts

Branch: main

Status: done

Commits this prompt:
- 6e24c21 - [codex] S31-F1: add bulk list selection contracts

Gate status: PASS - baseline `scripts/local-gate.ps1` exited 0 before selection; focused Vitest, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and final `scripts/local-gate.ps1` all exited 0. Final unit run passed 69 files / 373 tests and e2e passed 20 tests.

DoD self-check: PASS

Timestamp: 2026-05-24T05:37:45.2095863-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Confirmed single-agent root topology on `main` with a clean baseline and green full local gate.
- Added server-side bulk list selection contracts for current CRM list entities, including visible-row `recordIds` semantics, list-state preservation metadata, and downstream dry-run, selected-export, and execution support.
- Added API tests for deterministic contract metadata, supported execution action discovery, strict input rejection, and no-write catalog construction.
- Verified S31-F1 with focused Vitest, lint, typecheck, full unit suite, build, and full local gate/e2e.

### Next action

Run LOOP.md to begin S31-F2 - List-page selected export actions.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; implementation touched `lib/server/` and `tests/api/`, plus Codex report files)

CRM-CONTRACT.md honored: YES
