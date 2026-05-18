Agent: claude
Sprint: 4B (PREP-only this prompt)
Feature: Slice 1 — DEMO.md draft + route inventory
Branch: feat/claude-crm-ui-e2e
Status: blocked (waiting on Codex [UNBLOCK LIB] and Grok [UNBLOCK COMPONENTS])
Commits this prompt: pending — single doc commit planned for DEMO.md + report files
Gate status: NOT RUN (PREP-only; no runtime claims this prompt)
DoD self-check: N/A (PREP-only)
Timestamp: 2026-05-18T02:15:00-08:00

### Completed this prompt

- Sprint 4B prep-only orientation: read PLAN.md, CRM-CONTRACT.md, all five
  Sprint 4B prompts (`prompts/shared/SPRINT-4B-COORDINATION.md`,
  `prompts/{claude,codex,grok,gemini}/*-SPRINT-4B.md`).
- Verified [UNBLOCK LIB] state: `lib/featureFlags.ts` and `lib/postal.ts`
  do NOT exist on this branch → Codex has not shipped Slice 1.
- Verified [UNBLOCK COMPONENTS] state: `components/excluded-route-placeholder.tsx`,
  `components/routing-decision-detail.tsx`, and `components/postal-code-input.tsx`
  do NOT exist on this branch → Grok has not shipped the items 54/55/56 components.
- Inventoried `app/` routes vs CRM-CONTRACT.md ROUTE_REGISTRY (see Route Inventory
  section below).
- Created `DEMO.md` at repo root per Sprint 4B Slice 1 item 52 template, with
  `<TBD from SEED-ANCHORS>` placeholders flagged for Grok's S4-F1.

### Sprint 4B safe-vs-blocked task triage

**Safe now (PREP-only, no Codex/Grok dependency):**
- Slice 1 / Item 52 — DEMO.md draft (DONE this prompt, placeholders for seed values).
- Route inventory recorded in this SUMMARY.
- SUMMARY/BLOCKERS rewrite (this commit).

**Blocked on Codex `[UNBLOCK LIB]` (`feat/codex-services-routing-and-validation`):**
- Feature 2.1 — needs `EXCLUDED_ROUTES`, `FEATURE_FLAGS`, `isEnabled()` from `lib/featureFlags.ts`.
- Feature 2.2 — needs `getRoutingDecisionForLead` on `crmClient.leads` + `RoutingDecision` type.
- Feature 2.3 — needs `lib/postal.ts` (`normalizePostalCode`, `validatePostalCode`, `postalCodeSchema`)
  and the extended lead-creation Zod schema in `lib/validation.ts`.

**Blocked on Grok `[UNBLOCK COMPONENTS]` (`feat/grok-components-and-seed-tuning`):**
- Feature 2.1 page wiring — needs `<ExcludedRoutePlaceholder route={...} />`.
- Feature 2.2 routing detail wiring — needs `<RoutingDecisionDetail decision={...} />`.
- Feature 2.3 postal form wiring — needs `<PostalCodeInput value onChange country error />`.

**Blocked on Gemini (`feat/gemini-gate-and-coverage`):**
- Feature 2.4 CI badge — needs the CI workflow filename (e.g. `ci.yml`) and the
  repo's GitHub owner/repo path from Gemini's PR or from `package.json` `repository`.
- Canonical gate command (`pwsh scripts/local-gate.ps1`) — Gemini is fixing a
  baseline E2E gate blocker this prompt; fall back to `npm run test && npm run build && npm run test:e2e`
  until that lands.

**Owned but deferred (not in PREP scope; non-doc commits not authorized this prompt):**
- Feature 2.5 page polish (loading.tsx / error.tsx / `dynamic = "force-dynamic"`). Most
  `loading.tsx` files already exist; `error.tsx` is broadly missing. Page-level only,
  no Codex/Grok dependency for the error.tsx file itself.
- Feature 2.6 final audit — runs after the slices above complete.

### Route inventory (app/ vs CRM-CONTRACT.md)

Pages discovered under `app/` on this branch (`feat/claude-crm-ui-e2e`):

- `/` (`app/page.tsx`)
- `/dashboard`
- `/accounts`, `/accounts/[id]`, `/accounts/new`
- `/contacts`, `/contacts/[id]`, `/contacts/new` (new form may not exist — verify
  via Glob in next prompt)
- `/leads`, `/leads/[id]`
- `/deals`, `/deals/new` (NO `/deals/[id]` — drawer pattern, contract-conformant)
- `/orders`, `/orders/[id]`
- `/areas`
- `/forecast`
- `/activities`
- `/tasks`, `/tasks/new`  ← see coordination tension below
- `/cases`, `/cases/new`  ← see coordination tension below
- `/campaigns`, `/campaigns/new`  ← see coordination tension below
- `/reports`, `/reports/[slug]`

CRM-CONTRACT.md v1 ROUTE_REGISTRY: lists `/tasks`, `/cases`, `/campaigns`,
`/reports` as live routes (Sprint 4A contract). Item 17 stage history shipped.
No `/deals/[id]` per contract — drawer-canonical, confirmed.

Routes referenced in nav but pointing nowhere: none observed on this branch;
sidebar nav is registry-driven (C4 — `components/sidebar-nav.tsx`).

### Coordination tension (flag for human / IFT)

The Sprint 4B coordination plan (`prompts/shared/SPRINT-4B-COORDINATION.md`
"Item 54 — Broken-link guard") lists `/tasks`, `/cases`, `/campaigns` (plus
`/deals/[id]`) as EXCLUDED_ROUTES — routes that should 404 or render a
"not in demo" placeholder. **But this branch already ships `/tasks`,
`/cases`, `/campaigns` UI (C1–C3 in the prior SUMMARY entry).** Excluding
them now would delete shipped, contract-named, E2E-covered features.

Possible resolutions (do not act in PREP):
1. The Sprint 4B prompt set is stale relative to the C1–C7 work that
   merged into this branch — Codex's `EXCLUDED_ROUTES` const should
   omit `/tasks`, `/cases`, `/campaigns` and limit the exclusion list to
   `/deals/[id]` plus any never-shipped stubs.
2. C1–C7 was a parallel-branch line that was not intended to merge before
   Sprint 4B; the Sprint 4B exclusion list was authored against a base
   that does not include it.

I cannot pick a resolution without authorization. Filed as a blocker on
Codex (see BLOCKERS.claude.md) so the `EXCLUDED_ROUTES` content is
explicitly negotiated before I wire Feature 2.1 page-level guards.

### Branch mismatch

Sprint 4B prompt names Claude's branch as `feat/claude-demo-and-route-polish`.
This worktree is on `feat/claude-crm-ui-e2e`. Per the run prompt, I am NOT
switching branches in PREP. When implementation work begins, the human or
the next prompt should clarify whether Claude's Sprint 4B work continues on
this branch (which already contains C1–C7) or starts fresh from
`feat/claude-demo-and-route-polish` off a clean base.

### Prior shipped on this branch (preserved from previous SUMMARY snapshot)

These commits represent the current state of `feat/claude-crm-ui-e2e` and
are NOT undone by this prompt. They predate Sprint 4B and are not the work
of this PREP run.

- C1 (`feat(ui): tasks list detail and form`) — `/tasks` list with filters,
  drawer detail via `/tasks?task=<id>`, `/tasks/new` form, status update via
  `completeTask`/`updateTask`, delete.
- C2 (`feat(ui): cases list detail and form`) — `/cases` list, drawer detail,
  `/cases/new` form, status update via `resolveCase`/`updateCase`, delete.
- C3 (`feat(ui): campaigns list detail and form`) — `/campaigns` list, drawer
  detail, `/campaigns/new` form, status update, delete.
- C4 (`feat(ui): registry-driven sidebar nav`) — `components/sidebar-nav.tsx`
  appends Tasks/Cases/Campaigns from ENTITY_REGISTRY plus Reports.
- C5 (`feat(ui): global command palette`) — `components/command-palette.tsx`
  cmd/ctrl+K modal calling `globalSearch` via `components/command-palette-action.ts`
  server action.
- C6 (`feat(ui): reports index and detail pages`) — `/reports` and `/reports/[slug]`
  reading `lib/services/reports.ts`.
- C7 (`test(ui): e2e coverage for tasks cases campaigns reports`) — four new
  Playwright specs.

### Next action

Wait for Codex `[UNBLOCK LIB]` commit on `feat/codex-services-routing-and-validation`
(or its merge into this branch's base) AND Grok `[UNBLOCK COMPONENTS]` commit.
While waiting, the next safe Claude prompt could draft README "Known limitations"
text matching DEMO.md, and (with explicit scope) add the missing
`app/**/error.tsx` files (page-level, no Codex/Grok dependency). No CI badge
work until Gemini's CI workflow URL is known.

### Scope confirmation

No cross-ownership edits: YES (only `DEMO.md`, `SUMMARY.claude.md`,
`BLOCKERS.claude.md` touched — all Claude-owned)
CRM-CONTRACT.md honored: YES (read-only this prompt)
