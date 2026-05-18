Agent: claude
Sprint: 4B
Feature: Slice 2 Features 2.1, 2.2, 2.3 (wait state); Feature 2.4 CI badge (deferred)
Branch: feat/claude-demo-and-route-polish
Timestamp: 2026-05-18T04:30:00-08:00
Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 1 | `lib/featureFlags.ts` (Codex) | dependency | Feature 2.1 page-level broken-link guard cannot start. Need `EXCLUDED_ROUTES`, `FEATURE_FLAGS`, `isEnabled()` exports per CODEX-SPRINT-4B.md Slice 1a. | `ls lib/featureFlags.ts` → No such file or directory at HEAD `796f776`. | Codex `[UNBLOCK LIB]`. | DEMO.md, error boundary, README updates already shipped. Waiting on unblock + coordination-tension resolution (blocker #5). |
| 2 | `lib/postal.ts` + `lib/validation.ts` (Codex) | dependency | Feature 2.3 postal validation in lead form cannot start. Need `normalizePostalCode`, `validatePostalCode`, `postalCodeSchema` and extended lead-creation Zod schema per CODEX-SPRINT-4B.md Slice 1b. | `ls lib/postal.ts` → No such file or directory at HEAD `796f776`. | Codex `[UNBLOCK LIB]`. | None until unblock. |
| 3 | `lib/services/leads.ts` `getRoutingDecisionForLead` (Codex) | dependency | Feature 2.2 routing detail wiring needs `crmClient.leads.getRoutingDecision(id)` returning `RoutingDecision` type per CODEX-SPRINT-4B.md Slice 1c. | Not exposed on `lib/crm/crmClient.ts` at HEAD `796f776` (Codex has not shipped Slice 1). | Codex `[UNBLOCK LIB]`. | None until unblock. |
| 4 | `components/excluded-route-placeholder.tsx`, `components/routing-decision-detail.tsx`, `components/postal-code-input.tsx` (Grok) | dependency | Features 2.1, 2.2, 2.3 all need Grok-owned components before page-level wiring can complete. | All three files absent at HEAD `796f776`. | Grok `[UNBLOCK COMPONENTS]`. | None until unblock. |
| 5 | `lib/featureFlags.ts` `EXCLUDED_ROUTES` content (Codex / coordination) | contract | Sprint 4B coordination plan lists `/tasks`, `/cases`, `/campaigns` (plus `/deals/[id]`) as EXCLUDED_ROUTES, but this branch already ships those routes with E2E coverage (C1–C7). Cannot wire Feature 2.1 page guards without first reconciling the list. | `prompts/shared/SPRINT-4B-COORDINATION.md` Item 54 page-level row names `/tasks`, `/cases`, `/campaigns`; `app/{tasks,cases,campaigns}/page.tsx` are live and tested on this branch. | Codex to omit those three from `EXCLUDED_ROUTES` in Slice 1a, OR explicit human/IFT decision to retract C1–C7. | DEMO.md and README "Known limitations" written against actual repo state, not against the speculative exclusion list. |
| 6 | `e2e/visual-smoke.spec.ts` (Gemini) | gate | Canonical gate `pwsh scripts/local-gate.ps1` exits with code 1: 3 visual-snapshot pixel-diff failures on `dashboard-desktop` (chromium), `areas-desktop` (chromium, 637 px / 0.01 ratio), `areas-mobile` (chromium, 7704 px / 0.03 ratio). All three are in Gemini-owned files and Gemini-owned snapshot baselines. | `Exception … npm run test:e2e failed with exit code 1` from `scripts/local-gate.ps1` line 20 on this branch this prompt. Vitest 93/93 and `next build` are both green; only the e2e visual subset is red. | Gemini to refresh the snapshot baselines for those three viewports (or fix the underlying drift if it is non-cosmetic). | Run gate subset (`npm run test` + `npm run build`) for Claude-controllable claims until Gemini lands the fix. Do NOT touch the spec or the snapshot files (zone rules). |
| 7 | `.github/workflows/<file>.yml` (Gemini) | dependency | Feature 2.4 CI badge cannot be added — the workflow file the badge URL points to does not exist. | `ls .github/workflows/` → No such file or directory at HEAD `796f776`. | Gemini's CI workflow commit. | README "Demo" callout, routes table refresh, and limitations update shipped (commit `796f776`); the badge line is the only remaining piece of Feature 2.4. |
| 8 | Branch identity — running on `feat/claude-demo-and-route-polish`, anchored on the predecessor branch `feat/claude-crm-ui-e2e` HEAD `32faedf` rather than from `main` `c891083` | dependency | Sprint 4B prompts named `feat/claude-demo-and-route-polish` as the Sprint 4B Claude branch; this branch was created from the prior Claude branch HEAD so it carries C1–C7 plus the PREP commits. If the operator expected Sprint 4B to branch from a clean `main`, the relationship should be reconciled before merge. | `git log --oneline main..HEAD` shows the C1–C7 commits plus this prompt's 4 commits. | Operator confirmation that Sprint 4B work on this Claude branch is meant to layer on top of C1–C7, OR a directed rebranch from `main`. | Continue feature-level work on current branch; flag merge-order implications to the operator when Codex/Grok unblocks land. |

### Resolved this prompt

- None directly resolved. Blocker #1 from the prior prompt's BLOCKERS file
  is preserved here (still active). Blocker #6 / #7 from the prior prompt
  (gate script / CI workflow) are reaffirmed and refined with concrete
  evidence from the gate run this prompt.

### Blockers filed against other agents (cumulative — restated for handoff)

- **On Codex (`feat/codex-services-routing-and-validation`):**
  #1 `lib/featureFlags.ts`, #2 `lib/postal.ts` + extended `lib/validation.ts`,
  #3 `getRoutingDecisionForLead` exposure on `crmClient.leads`, and #5
  reconciliation of `EXCLUDED_ROUTES` content vs C1–C3 shipped state.
- **On Grok (`feat/grok-components-and-seed-tuning`):**
  #4 the three coordination-pair components for items 54/55/56, plus the
  implicit ask for finalized SEED-ANCHORS values to replace the `<TBD>`
  placeholders in `DEMO.md`.
- **On Gemini (`feat/gemini-gate-and-coverage`):**
  #6 baseline E2E gate fix (refresh visual-smoke snapshots), #7
  `.github/workflows/<file>.yml` for the README CI badge target.
