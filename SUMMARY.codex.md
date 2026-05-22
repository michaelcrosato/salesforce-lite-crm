Agent: Codex

Sprint: 20

Feature: S20-F1 - CSV operator walkthrough manifests

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 41d2a1d - [codex] S20-F1: add CSV operator walkthrough manifests

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after npm install, Prisma generate/db push, seed, lint, typecheck, 47 Vitest files / 271 tests, build, Playwright chromium install, and 19 Playwright tests.

DoD self-check: PASS

Timestamp: 2026-05-21T20:31:01.1249587-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 pre-flight from `C:\dev\salesforce-lite-crm`; all four expected worktrees existed, the tree was clean on `codex/sprint-4-demo-seed-tuning`, and the full local gate passed before edits.
- Reviewed `PLAN.md`, `CRM-CONTRACT.md`, `README.md`, all agent SUMMARY/BLOCKERS files, `docs/decisions.md`, `docs/FEATURE-BACKLOG.md`, `docs/ROADMAP.md`, `docs/LOCAL-GATE.md`, `docs/PROJECT-CONTROL.md`, `docs/MERGE-PLAYBOOK.md`, `docs/NEXT-PROMPTS.md`, `prompts/README.md`, and the shared Sprint 4 prompt artifacts referenced by those files.
- Implemented `lib/server/csvOperatorWalkthroughManifests.ts`, publishing deterministic root, entity, and operation walkthrough manifests that compose CSV capabilities, import template/example metadata, fixture packet availability, S19 release notes, and S19 acceptance checklists with source fingerprints, ordered step labels, watch/block notes, and explicit no-write flags.
- Added focused Vitest coverage in `tests/api/csv-operator-walkthrough-manifests.test.ts` for deterministic root metadata, operation/entity manifests, source fingerprints/content types, ordered steps, no-write behavior, and unknown-key guards.
- Cross-zone edit: touched `tests/api/csv-operator-walkthrough-manifests.test.ts` in Gemini's zone because PLAN §8 requires test coverage for new server behavior and the smallest meaningful coverage belongs with the existing CSV API Vitest suites.
- Verified implementation with `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, then the full `scripts/local-gate.ps1`.

### Discovered this prompt

- `PLAN.md` still contains a stale "Current prompt scope - Sprint Rollover" note even though the current LOOP prompt and latest Codex report identify rollover planning as complete and S20-F1 as the next queued Codex work.
- Historical Claude/Grok/Gemini summaries still reference "Sprint 4B", which is not an active PLAN §4 sprint row. Current repo authority remains PLAN §4 plus this prompt and the green local gate.

### Next action

Run LOOP.md to begin S20-F2 - CSV release closure scorecards.

### Scope confirmation

No cross-ownership edits: NO - added one focused Vitest file under `tests/api/**` with the §10 reason documented above.

CRM-CONTRACT.md honored: YES
