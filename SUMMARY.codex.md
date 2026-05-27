Agent: Codex

Sprint: 49

Feature: S49-F1 - Saved report definition contracts

Branch: main

Status: done

Commits this prompt: fe69d81 - [codex] S49-F1: add saved report definition contracts

Gate status: PASS - Phase 0 baseline passed on 2026-05-27 through `npm run build`. Phase 5 full local gate passed on 2026-05-27 using `scripts/local-gate.ps1`: `npm install`, env bootstrap, `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run lint`, `npm run typecheck`, `npm run test` (103 files / 518 tests), `npm run build`, `npx playwright install chromium`, and `npm run test:e2e` (43 tests).

DoD self-check: PASS

Timestamp: 2026-05-27T04:04:25.1335087-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran the required Phase 0 baseline from the single-agent root worktree and confirmed `main` was clean and green through `npm run build`.
- Reconciled PLAN, CRM contract, README, Codex and other-agent reports, decision history, project-control docs, local-gate docs, roadmap docs, prompt docs, and the route/report surface evidence.
- Resolved the prior Codex blocker by using the current full-autonomy runner context as the one-run authorization to perform the `CRM-CONTRACT.md` update that `PLAN.md` S49-F1 explicitly requires.
- Added `lib/server/savedReportDefinitions.ts`, a metadata-only saved-report definition contract catalog for accounts, contacts, opportunities, leads, activities, dealer orders, areas, tasks, cases, and campaigns.
- Added `validateSavedReportDefinitionDraft()` coverage for supported fields, filters, groupings, chart dimensions, chart metrics, preview limits, source surfaces, and explicit no-write flags without adding UI, routes, persistence, raw SQL, providers, background jobs, or CSV apply behavior.
- Added focused Vitest coverage in `tests/api/saved-report-definitions.test.ts` and updated `CRM-CONTRACT.md` with the new server contract.
- Verified the full local gate with `scripts/local-gate.ps1`.

### Discovered this prompt

- The active Sprint 49 queue is coherent once the prompt's full-autonomy runner wrapper is treated as resolving the earlier S49-F1 contract-update mismatch. The implementation remained inside S49-F1 acceptance and did not require a schema, route, or UI change.
- Other-agent report files still describe older Sprint 4/Sprint 5 branch state, but current project-control docs mark those files as historical handoff records. PLAN.md, CRM-CONTRACT.md, and local gate output remain the current authority.

### Next action

Start S49-F2 - Saved report preview runner, using the new saved report definition contracts to execute read-only bounded previews through existing list/report/filter services.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; repo-wide scope documented)

CRM-CONTRACT.md honored:  YES
