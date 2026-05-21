Agent: Codex

Sprint: 18

Feature: S18-F1 - CSV release verification manifests

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: ed78428 - [codex] S18-F1: add CSV release verification manifests

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after implementation with 43 Vitest files / 254 tests and 19 Playwright tests passing.

DoD self-check: PASS

Timestamp: 2026-05-21T14:50:07.8886670-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from `C:\dev\salesforce-lite-crm`; all four expected worktrees existed, branch matched `codex/`, the tree was clean, and `scripts/local-gate.ps1` exited 0 before edits.
- Reviewed `PLAN.md`, `CRM-CONTRACT.md`, README, all agent SUMMARY/BLOCKERS files, `docs/decisions.md`, referenced project docs/prompts, `git diff main...HEAD --stat`, and recent commits before selection.
- Added `lib/server/csvReleaseVerificationManifests.ts`, a read-only server helper over the current CSV release digest and operator handoff packets with root, entity, and operation manifests; source fingerprints/content types; operation/entity coverage; warning/source-code rollups; deterministic manifest fingerprinting; and explicit no-write flags.
- Added focused Vitest coverage in `tests/api/csv-release-verification-manifests.test.ts` for deterministic manifests, coverage counts, rollups, fingerprints, no-write guarantees, and unknown key rejection. Cross-zone reason: PLAN §8 requires feature coverage before done, and existing Codex CSV server contracts are verified under `tests/api/`.
- Verified the implementation with `npm run lint`, `npm run typecheck`, focused `npm run test -- tests/api/csv-release-verification-manifests.test.ts`, `npm run build`, and the full `scripts/local-gate.ps1`.

### Discovered this prompt

- `PLAN.md` §4 still contains a stale "Current prompt scope - Sprint Rollover" note from the prior planning pass, while the current LOOP prompt and `SUMMARY.codex.md` made S18-F1 the next work unit. Per PLAN §2, the current prompt was treated as authoritative.

### Next action

Run LOOP.md again to begin S18-F2 - CSV operator fixture bundles.

### Scope confirmation

No cross-ownership edits: NO (cross-zone Vitest coverage in `tests/api/csv-release-verification-manifests.test.ts` was the smallest direct way to satisfy PLAN §8 for this Codex server feature)

CRM-CONTRACT.md honored: YES
