Agent: Codex

Sprint: 21

Feature: S21-F2 - CSV release exception register

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 2114d69 - [codex] S21-F2: add CSV release exception register

Gate status: PASS - Phase 0 baseline commands through `npm run build` exited 0, and Phase 5 `scripts/local-gate.ps1` exited 0. Final gate covered npm install, Prisma generate/db push, seed, lint, typecheck, 50 Vitest files / 283 tests, build, Playwright chromium install, and 19 Playwright tests.

DoD self-check: PASS

Timestamp: 2026-05-22T03:38:56.1603845-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 from `C:\dev\salesforce-lite-crm`; the expected Codex, Claude, Grok, and Gemini worktrees existed, the branch was `codex/sprint-4-demo-seed-tuning`, the tree was clean, and baseline install/bootstrap/Prisma/seed/lint/typecheck/test/build checks passed before edits.
- Read and reconciled `PLAN.md`, `CRM-CONTRACT.md`, README, all agent SUMMARY/BLOCKERS files, `docs/decisions.md`, `docs/FEATURE-BACKLOG.md`, `docs/ROADMAP.md`, `docs/LOCAL-GATE.md`, `docs/PROJECT-CONTROL.md`, `docs/MERGE-PLAYBOOK.md`, `docs/NEXT-PROMPTS.md`, `docs/WORKTREE-SETUP.md`, `docs/roadmap/ROADMAP-IFT-R1-REVIEW.md`, `prompts/README.md`, and current shared S4 prompt artifacts.
- Discovered this prompt: `PLAN.md` §4 and `docs/FEATURE-BACKLOG.md` still show S21-F1 queued, while `SUMMARY.codex.md` from the previous prompt cited implementation commit `e74dd90` and a green full local gate. Per §2, the green local gate and commit evidence were sufficient to select S21-F2.
- Implemented `lib/server/csvReleaseExceptionRegisters.ts`, a deterministic read-only server helper that composes release closure scorecards, operator acceptance checklists, operator fixture bundles, and operator walkthrough manifests into root/entity/operation exception registers for watch/block CSV release items.
- Added `tests/api/csv-release-exception-registers.test.ts` as a documented §10 cross-zone test exception. The test validates deterministic root metadata, entity and operation registers, source fingerprints, remediation-ready entries, no-write safety, no database mutation, and unknown key rejection.
- Verified with focused `npm run test -- tests/api/csv-release-exception-registers.test.ts`, `npm run lint`, `npm run typecheck`, and final full `scripts/local-gate.ps1`.

### Next action

Run Codex sprint rollover planning before the next implementation prompt; no further Codex-owned Sprint 21 feature remains queued after S21-F2.

### Scope confirmation

No cross-ownership edits: NO - added one focused Vitest file under `tests/api/` as the smallest direct validation for the new Codex-owned server helper; no app, component, e2e, config, package, route, schema, or runtime workflow files changed.

CRM-CONTRACT.md honored: YES
