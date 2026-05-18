Agent: claude
Sprint: 4B
Feature: Slice 2 complete on Claude side; handing pending pieces back to peers
Branch: feat/claude-demo-and-route-polish
Timestamp: 2026-05-18T09:55:00-08:00
Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 5 | `lib/featureFlags.ts` `EXCLUDED_ROUTES` content | contract | Codex's shipped `EXCLUDED_ROUTES` lists `/tasks`, `/cases`, `/campaigns`, but those routes are live on this branch with full UI (C1–C3) and e2e coverage. Cannot wire page-level placeholders for those three without deleting shipped, demo-relevant features. My Feature 2.1 honored the live UI and only added placeholders for the 7 truly-absent routes. | `lib/featureFlags.ts` lines 17–19 list `/tasks`, `/cases`, `/campaigns`; `app/{tasks,cases,campaigns}/page.tsx` exist with passing e2e specs (`e2e/tasks.spec.ts`, `e2e/cases.spec.ts`, `e2e/campaigns.spec.ts`). | Codex to remove `/tasks`, `/cases`, `/campaigns` from `EXCLUDED_ROUTES`, OR explicit human/IFT decision to retract C1–C3. | DEMO.md, README, and the broken-link page guards reflect actual repo state (the three routes are live). Will not regress the shipped UI without explicit instruction. |
| 7 | `.github/workflows/<file>.yml` (Gemini) | dependency | Feature 2.4 README CI badge cannot be added — no workflow file exists to point the badge URL at. The rest of Feature 2.4 (Demo callout, routes refresh, limitations update) shipped in commit `796f776`. | `ls .github/workflows/` → No such file or directory. | Gemini to ship a CI workflow file. | None until Gemini lands; README is correct otherwise. |
| 9 | `components/lead-form.tsx` (Grok) | ownership | The lead form still uses a plain `<Input id="postalCode">` instead of Grok's new `<PostalCodeInput>` component. Backend validation through `leadFormSchema` is correct and surfaces field errors; my actions.ts now also produces a postal-specific toast when postalCode is the only failing field. But the demo-quality client-side normalize-on-blur experience requires the new component to be mounted in the lead form. | Read of `components/lead-form.tsx` shows plain `<Input id="postalCode" name="postalCode" placeholder="V5K 0A1" />`. | Grok to swap to `<PostalCodeInput value={...} onChange={...} country="CA" error={errors?.postalCode?.[0]} testid="lead-form-postal-input" />` inside `components/lead-form.tsx`. | Backend validation works end-to-end as of commit `d26dc58`. Demo path renders inline field error from server action. |

### Resolved this prompt

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
- **On Grok (`feat/grok-components-and-seed-tuning`):**
  #9 swap plain `<Input id="postalCode">` for `<PostalCodeInput>` inside
  `components/lead-form.tsx`. Backend validation already supports it.
- **On Gemini (`feat/gemini-gate-and-coverage` / their Sprint 4B branch):**
  #7 ship `.github/workflows/<file>.yml` so the README CI badge can be added.
  Also: consider an `e2e/excluded-routes.spec.ts` consuming the new
  `data-testid="excluded-route-placeholder"` markers on the 7 placeholder
  pages.
