Agent: claude
Sprint: 4B
Feature: Slice 2 complete; postal client-wiring now consumed; only Codex coordination tension and Gemini CI workflow remain
Branch: feat/claude-demo-and-route-polish
Timestamp: 2026-05-18T10:35:00-08:00
Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 5 | `lib/featureFlags.ts` `EXCLUDED_ROUTES` content | contract | Codex's shipped `EXCLUDED_ROUTES` lists `/tasks`, `/cases`, `/campaigns`, but those routes are live on this branch with full UI (C1–C3) and e2e coverage. Cannot wire page-level placeholders for those three without deleting shipped, demo-relevant features. My Feature 2.1 honored the live UI and only added placeholders for the 7 truly-absent routes. | `lib/featureFlags.ts` lines 17–19 list `/tasks`, `/cases`, `/campaigns`; `app/{tasks,cases,campaigns}/page.tsx` exist with passing e2e specs (`e2e/tasks.spec.ts`, `e2e/cases.spec.ts`, `e2e/campaigns.spec.ts`). | Codex to remove `/tasks`, `/cases`, `/campaigns` from `EXCLUDED_ROUTES`, OR explicit human/IFT decision to retract C1–C3. | DEMO.md, README, and the broken-link page guards reflect actual repo state (the three routes are live). Will not regress the shipped UI without explicit instruction. |
| 7 | `.github/workflows/<file>.yml` (Gemini) | dependency | Feature 2.4 README CI badge cannot be added — no workflow file exists to point the badge URL at. The rest of Feature 2.4 (Demo callout, routes refresh, limitations update) shipped in commit `796f776`. | `ls .github/workflows/` → No such file or directory. | Gemini to ship a CI workflow file. | None until Gemini lands; README is correct otherwise. |

### Resolved this prompt

- **Blocker #9 (Grok `<PostalCodeInput>` wiring into `components/lead-form.tsx`):**
  consumed via Grok merge `4d34708` / `cf69810` (now part of merge commit
  `be24f34`). `components/lead-form.tsx` mounts `<PostalCodeInput>` with
  `testid="lead-form-postal-input"`, controlled value, error binding, and
  reset-on-success. Full gate green after merge.

### Resolved in prior prompts (carried for context)

- **Blocker #1 (Codex `lib/featureFlags.ts`):** consumed via Grok merge.
  `lib/featureFlags.ts` now present at this branch HEAD with `FEATURE_FLAGS`,
  `EXCLUDED_ROUTES`, `isEnabled()` exports.
- **Blocker #2 (Codex `lib/postal.ts` + extended `lib/validation.ts`):** consumed
  via Grok merge. `lib/postal.ts` exports `normalizePostalCode`,
  `extractPostalPrefix`, `validatePostalCode`, `postalCodeSchema`.
  `lib/validation.ts` composes `optionalPostalCode` into `leadFormSchema`.
- **Blocker #3 (Codex `getRoutingDecisionForLead`):** consumed via Grok merge.
  `lib/crm/crmClient.ts` exports `getRoutingDecisionForLead` and the namespaced
  `crmClient.leads.getRoutingDecision`. `lib/services/leads.ts` implements the
  underlying service.
- **Blocker #4 (Grok components):** consumed via Grok merge. `<ExcludedRoutePlaceholder>`,
  `<RoutingDecisionDetail>`, `<PostalCodeInput>`, and `<PageSkeleton>` are all
  present and imported.
- **Blocker #6 (Gemini e2e gate):** consumed via Gemini merge.
  `pwsh scripts/local-gate.ps1` exits 0 ("Local gate completed successfully").
  All 11 e2e tests pass including the previously-failing visual snapshots.
- **Blocker #8 (branch identity):** clarified — this branch
  (`feat/claude-demo-and-route-polish`) carries C1–C7 plus all Sprint 4B
  Claude work plus the consumed Grok and Gemini unblocks. Merge order to
  main per `prompts/shared/SPRINT-4B-COORDINATION.md` final-merge-sequence is
  Codex → Grok → Claude → Gemini, but on this branch Grok and Gemini are
  already merged in. Merge-order resolution at coordination time.

### Blockers filed against other agents (current outstanding)

- **On Codex (`feat/codex-services-routing-and-validation`):**
  #5 reconcile `EXCLUDED_ROUTES` content vs the live `/tasks`, `/cases`,
  `/campaigns` UI shipped in C1–C3.
- **On Gemini (`feat/gemini-gate-and-coverage` / their Sprint 4B branch):**
  #7 ship `.github/workflows/<file>.yml` so the README CI badge can be added.
  Also: consider an `e2e/excluded-routes.spec.ts` consuming the new
  `data-testid="excluded-route-placeholder"` markers on the 7 placeholder
  pages.
