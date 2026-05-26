Agent: Codex

Sprint: 44

Feature: S44-F2 — Responsive CRM surface audit

Branch: main

Status: repaired

Commits this prompt:
- bc6e14b

Gate status: PASS — `scripts/local-gate.ps1` completed successfully after the implementation commit. A preceding rerun hit transient Vitest timeouts in `tests/api/csv-release-readiness-packets.test.ts`; the focused file and full `npm run test` both passed before the final green local gate.

DoD self-check: PASS

Timestamp: 2026-05-26T07:20:16.4748881-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Repaired S44-F2 responsive overflow by containing mobile shell navigation, shared card/table scroll regions, list selected-export controls, and dense report operator grids with `min-w-0`, constrained scroll containers, and `minmax(0,1fr)` grid tracks.
- Removed redundant absolute `sr-only` pacing status text from the dealer orders table because `PacingBar` already renders the status label; the hidden absolute element was contributing document-level horizontal scroll from inside the local table scroll region.
- Added `e2e/responsive-layout.spec.ts` coverage for current CRM routes at mobile and desktop widths.

### Next action

Continue Sprint 44 from `PLAN.md` after confirming no new blockers are introduced by the next prompt.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; historical zones were advisory)

CRM-CONTRACT.md honored: YES
