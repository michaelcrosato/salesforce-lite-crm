Agent: claude
Sprint: 4B (PREP-only)
Feature: Slice 1 / Slice 2 wait-state
Branch: feat/claude-crm-ui-e2e
Timestamp: 2026-05-18T02:15:00-08:00
Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 1 | `lib/featureFlags.ts` (Codex) | dependency | Slice 2 Feature 2.1 page-level broken-link guard cannot start. Need `EXCLUDED_ROUTES`, `FEATURE_FLAGS`, `isEnabled()` exports per `prompts/codex/CODEX-SPRINT-4B.md` Slice 1a. | `ls lib/featureFlags.ts` → No such file or directory. | Codex `[UNBLOCK LIB]` commit on `feat/codex-services-routing-and-validation`. | DEMO.md drafted; route inventory recorded. Will wire pages once `EXCLUDED_ROUTES` list is authoritative and the coordination-tension blocker (#5) is resolved. |
| 2 | `lib/postal.ts` + `lib/validation.ts` (Codex) | dependency | Slice 2 Feature 2.3 postal validation in lead form cannot start. Need `normalizePostalCode`, `validatePostalCode`, `postalCodeSchema` and extended lead-creation Zod schema per CODEX-SPRINT-4B.md Slice 1b. | `ls lib/postal.ts` → No such file or directory. | Codex `[UNBLOCK LIB]`. | None until unblock. Will wire `app/leads/actions.ts` validation path on unblock. |
| 3 | `lib/services/leads.ts` getRoutingDecisionForLead (Codex) | dependency | Slice 2 Feature 2.2 routing detail wiring needs `crmClient.leads.getRoutingDecision(id)` returning `RoutingDecision` type per CODEX-SPRINT-4B.md Slice 1c. | Not yet exposed on `lib/crm/crmClient.ts` (Codex has not shipped Slice 1). | Codex `[UNBLOCK LIB]`. | None until unblock. |
| 4 | `components/excluded-route-placeholder.tsx`, `components/routing-decision-detail.tsx`, `components/postal-code-input.tsx` (Grok) | dependency | Slice 2 Features 2.1, 2.2, 2.3 all need Grok-owned components before page-level wiring can complete. | `ls components/{excluded-route-placeholder,routing-decision-detail,postal-code-input}.tsx` → No such file or directory. | Grok `[UNBLOCK COMPONENTS]` commit on `feat/grok-components-and-seed-tuning`. | None until unblock. Page imports cannot be drafted against components that may change export shape. |
| 5 | `lib/featureFlags.ts` `EXCLUDED_ROUTES` content (Codex / coordination) | contract | The Sprint 4B coordination plan lists `/tasks`, `/cases`, `/campaigns` as EXCLUDED_ROUTES, but this branch (`feat/claude-crm-ui-e2e`) already ships `/tasks`, `/cases`, `/campaigns` UI (C1–C3 per prior SUMMARY.claude.md). Excluding them would delete shipped E2E-covered features. The `EXCLUDED_ROUTES` content has to be reconciled before Feature 2.1 can wire any page-level guard. | `prompts/shared/SPRINT-4B-COORDINATION.md` Item 54 row "Page: `app/<excluded>/page.tsx`" lists `/tasks`, `/cases`, `/campaigns`; this branch's `app/tasks/page.tsx`, `app/cases/page.tsx`, `app/campaigns/page.tsx` are live and tested. | Codex to either (a) omit `/tasks`/`/cases`/`/campaigns` from `EXCLUDED_ROUTES` in Slice 1a, or (b) explicit human/IFT decision to retract C1–C3. | DEMO.md and limitations text written against actual repo state, NOT against the speculative exclusion. |
| 6 | `scripts/local-gate.ps1` canonical gate (Gemini) | dependency | Sprint 4B prompts reference `pwsh scripts/local-gate.ps1` as the gate-of-record. Until Gemini ships it, the fallback is `npm run test && npm run build && npm run test:e2e`. Gemini is currently fixing a baseline E2E gate blocker. | User-supplied context: "Gemini is currently fixing a baseline E2E gate blocker." | Gemini `[UNBLOCK GATE]`. | Use fallback for any future gate run; do not claim `pwsh scripts/local-gate.ps1` passed until it exists. |
| 7 | `.github/workflows/ci.yml` (Gemini) | dependency | Slice 2 Feature 2.4 README CI badge needs the actual workflow filename and the GitHub owner/repo path. | Workflow file not yet inspected; user prompt says Gemini is fixing the gate. | Gemini's CI workflow commit. | Draft the README "Known limitations" prose now matching DEMO.md; defer the badge URL until the workflow exists. |
| 8 | Branch mismatch — current is `feat/claude-crm-ui-e2e`; Sprint 4B prompt names `feat/claude-demo-and-route-polish` | dependency | Working in PREP only this prompt, no branch switch. When implementation work begins, the human should clarify whether Sprint 4B work continues on `feat/claude-crm-ui-e2e` (already has C1–C7) or restarts on `feat/claude-demo-and-route-polish`. | `git branch --show-current` → `feat/claude-crm-ui-e2e`; CLAUDE-SPRINT-4B.md pre-flight names `feat/claude-demo-and-route-polish`. | Human or next prompt scope. | Continue on current branch for PREP doc/inventory work only. |

### Resolved this prompt

- None.

### Blockers filed against other agents

- **On Codex:** #1 `lib/featureFlags.ts`, #2 `lib/postal.ts` + `lib/validation.ts`,
  #3 `getRoutingDecisionForLead` exposure, and #5 the coordination-tension
  reconciliation of `EXCLUDED_ROUTES` content vs C1–C3 shipped state.
- **On Grok:** #4 the three components for items 54/55/56, plus the implicit
  request for SEED-ANCHORS to fill `<TBD>` placeholders in DEMO.md.
- **On Gemini:** #6 `scripts/local-gate.ps1`, #7 CI workflow URL/badge target.
