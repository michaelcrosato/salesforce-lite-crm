Agent: Codex

Sprint: Sprint 31

Feature: S31-F2 - List-page selected export actions

Branch: main

Status: done

Commits this prompt:
- a9f5fed - [codex] S31-F2: add list selected export actions

Gate status: PASS - baseline `scripts/local-gate.ps1` exited 0 before selection; targeted `npx vitest run tests/api/list-selected-export-action.test.ts --maxWorkers=1 --minWorkers=1` exited 0; targeted `npx playwright test e2e/list-selected-export.spec.ts` exited 0; final `scripts/local-gate.ps1` exited 0 with 70 Vitest files / 375 tests and 21 Playwright tests passing.

DoD self-check: PASS

Timestamp: 2026-05-24T07:00:09.9201817-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Reconciled the root worktree as single-agent full-repo mode on `main`; historical owner zones were advisory and the baseline local gate was green.
- Added a read-only list selected export server action that validates supported entities and visible selected IDs, calls the existing S30 selected-export packet service, and returns a client-safe CSV payload without database writes.
- Added shared selected-visible-record export controls and wired them into accounts, contacts, opportunities, leads, activities, dealer orders, areas, tasks, cases, and campaigns.
- Added Vitest coverage for action validation/order/no-write behavior and Playwright coverage for contact-list selected CSV download behavior.

### Discovered this prompt

- PLAN §4 still lists S31-F1/S31-F2/S31-F3 as queued, while recent green-gated Codex commits support S31-F1 as complete and this prompt completes S31-F2.
- Gemini's historical SUMMARY references an S5-F1 visual snapshot scope that is not the Sprint 5 row currently present in PLAN §4; treated as stale cross-agent context, not active scope.
- A root `SPRINT-ROLLOVER.md` file is absent, while per-agent rollover prompts exist under `prompts/<agent>/SPRINT-ROLLOVER.md`; no blocker filed because `CRM-CONTRACT.md` is present and current LOOP scope did not require rollover.

### Next action

Run LOOP.md to begin S31-F3 - List-page bulk execution actions.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; S31-F2 coherently spanned app, component, and test surfaces)

CRM-CONTRACT.md honored: YES
