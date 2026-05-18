Agent: claude
Sprint: 4B
Feature: Slices 0, 1 and partial Slice 2 (Features 2.4 and 2.5 partial)
Branch: feat/claude-demo-and-route-polish
Status: blocked (waiting on Codex [UNBLOCK LIB] and Grok [UNBLOCK COMPONENTS])
Commits this prompt: 2fb5944 — feat(claude): page-level error boundary; 796f776 — docs(claude): readme demo callout and routes refresh
Gate status: PARTIAL — vitest 93/93 PASS, next build PASS (24 routes), e2e RED on pre-existing visual snapshot drift in Gemini zone
DoD self-check: PASS for shipped features (Slice 1 docs and Feature 2.5 error boundary), N/A for blocked features
Timestamp: 2026-05-18T04:30:00-08:00

### Completed this prompt

- Preflight: archived `..\salesforce-lite-crm-sprint-4b-claude-start.zip` at `32faedf`,
  created branch `feat/claude-demo-and-route-polish` from current HEAD (carries the
  prior PREP commits forward: DEMO.md plus prior SUMMARY/BLOCKERS).
- Slice 0: ran the full canonical gate `pwsh scripts/local-gate.ps1`. Vitest 93/93,
  `next build` clean (24 routes), but the gate exits with code 1 because
  `e2e/visual-smoke.spec.ts` has 3 pre-existing pixel-diff snapshot failures
  (`dashboard-desktop`, `areas-desktop`, `areas-mobile`). All three are in
  Gemini-owned files; not touching them per zone rules. Filed as the
  baseline-E2E blocker the user prompt described.
- Slice 1 (Item 52): DEMO.md already shipped as `72e0ad5 docs(claude): five-minute demo
  walkthrough` in the prior PREP turn — rides along on this branch. No re-commit.
- Feature 2.5 (page-level polish, partial): added `app/error.tsx` as the
  catch-all Next.js error boundary. It is a client component, renders a "Something
  went wrong" message with a Reset button (calls the framework `reset` prop) and a
  Reload page button, surfaces the error digest when present, and tags itself with
  `data-testid="page-error-boundary"` plus per-button testids
  (`page-error-reset`, `page-error-reload`). One root file covers every child route
  via Next.js error-boundary nesting; per-route error.tsx files were deferred
  because no route currently needs custom error UI distinct from the catch-all.
  Verified `next build` still green after adding it.
- Feature 2.4 (README, partial — no CI badge): added a "Demo" callout near the top
  of README.md pointing at `DEMO.md` and noting `npm run seed` as the one-click
  reset. Refreshed the routes table to include the now-live `/tasks`, `/cases`,
  `/campaigns`, `/reports`, and their detail/create routes (C1–C7 had shipped them
  on the predecessor branch). Removed two stale notes claiming tasks/cases/campaigns
  pages "not present in this worktree yet" — those notes were factually wrong on
  this branch. Added two limitations entries (no CSV import/export, no Lead
  conversion flow). CI badge intentionally skipped — `.github/workflows/` does not
  exist yet on this branch (Gemini owns CI workflow files).

### Pre-existing audit findings (no edits this prompt)

- `export const dynamic = "force-dynamic"` is already present on all 23 data-reading
  pages under `app/`. Only `app/page.tsx` (a redirect to `/dashboard`) lacks it,
  which is correct.
- 20 of 23 pages wrap content in `<div className="crm-page">`; `app/forecast/page.tsx`,
  `app/deals/page.tsx`, and `app/orders/page.tsx` use bespoke wrappers. No
  page-level `data-testid="page-<slug>"` exists yet on any page. The wider testid
  pass was deferred — it clusters naturally with the Slice 2 Feature 2.1/2.2/2.3
  wiring, which explicitly introduces feature-specific testids
  (`routing-detail-toggle-{leadId}`, `lead-form-postal-input`,
  `excluded-route-placeholder`). Doing the page-wrapper testids in the same
  commit as the unblock wiring keeps the e2e-supporting test surface coherent and
  avoids a separate noisy mass edit before Gemini's specs need them.

### Sprint 4B safe-vs-blocked task triage (current state)

**Shipped this prompt (cumulative including prior PREP):**
- Slice 1 / Item 52 — DEMO.md ✅
- Feature 2.5 — `app/error.tsx` catch-all error boundary ✅
- Feature 2.4 — README "Demo" callout, refreshed routes table, limitations update ✅

**Blocked on Codex `[UNBLOCK LIB]`:**
- Feature 2.1 — needs `EXCLUDED_ROUTES`, `FEATURE_FLAGS`, `isEnabled()` from `lib/featureFlags.ts`
- Feature 2.2 — needs `getRoutingDecisionForLead` on `crmClient.leads` + `RoutingDecision` type
- Feature 2.3 — needs `lib/postal.ts` and extended lead schema in `lib/validation.ts`

**Blocked on Grok `[UNBLOCK COMPONENTS]`:**
- Feature 2.1 page wiring — needs `<ExcludedRoutePlaceholder route={...} />`
- Feature 2.2 wiring — needs `<RoutingDecisionDetail decision={...} />`
- Feature 2.3 wiring — needs `<PostalCodeInput value onChange country error />`

**Blocked on Gemini:**
- Feature 2.4 CI badge — needs `.github/workflows/<file>.yml` (workflow file
  currently absent; cannot derive URL)
- Canonical gate — `pwsh scripts/local-gate.ps1` exits 1 on `e2e/visual-smoke.spec.ts`
  pixel-diff drift; Gemini-owned, awaiting their fix
- Feature 2.5 `<PageSkeleton />`-based loading.tsx — not strictly required as a
  blocker; existing `loading.tsx` files in `app/` use `<Skeleton>` primitives
  directly and render the demo-acceptable busy state

### Coordination tension (carried from prior turn)

The Sprint 4B coordination plan (`prompts/shared/SPRINT-4B-COORDINATION.md`
"Item 54 — Broken-link guard") lists `/tasks`, `/cases`, `/campaigns` plus
`/deals/[id]` as EXCLUDED_ROUTES, but this branch already ships
`/tasks`, `/cases`, `/campaigns` UI and E2E coverage (C1–C7). Wiring Feature 2.1
will require Codex's `EXCLUDED_ROUTES` to omit those three routes, or an
explicit human/IFT retraction of C1–C7. Filed as BLOCKERS entry #5.

### Route inventory (app/ vs CRM-CONTRACT.md, refreshed)

Pages built into the production bundle (`next build` route table):

`/`, `/dashboard`, `/accounts`, `/accounts/[id]`, `/accounts/new`,
`/activities`, `/areas`, `/contacts`, `/contacts/[id]`, `/deals`, `/deals/new`,
`/forecast`, `/leads`, `/leads/[id]`, `/orders`, `/orders/[id]`,
`/tasks`, `/tasks/new`, `/cases`, `/cases/new`, `/campaigns`, `/campaigns/new`,
`/reports`, `/reports/[slug]`, `/_not-found` (Next.js implicit).

CRM-CONTRACT.md v1 ROUTE_REGISTRY currently lists all of these. There is no
`/deals/[id]` per contract (drawer-canonical). Sidebar nav is
registry-driven (`components/sidebar-nav.tsx`, Grok-owned), so no `app/`-side
nav editing is required for that policy to hold.

### Prior shipped on this branch (carried context, not changed this prompt)

C1–C7 (Sprint 4A line) live on this branch:
- C1 `feat(ui): tasks list detail and form`
- C2 `feat(ui): cases list detail and form`
- C3 `feat(ui): campaigns list detail and form`
- C4 `feat(ui): registry-driven sidebar nav`
- C5 `feat(ui): global command palette`
- C6 `feat(ui): reports index and detail pages`
- C7 `test(ui): e2e coverage for tasks cases campaigns reports`

### Next action

Wait for Codex `[UNBLOCK LIB]` commit and Grok `[UNBLOCK COMPONENTS]` commit
on their respective branches (or on `main`). Once both are visible to this
branch, proceed with Feature 2.1 (broken-link guards conditional on
EXCLUDED_ROUTES resolution per coordination-tension blocker), Feature 2.2
(routing detail wiring on `/leads` and `/orders/[id]`), Feature 2.3 (postal
validation in `app/leads/actions.ts` and the lead form on `/leads`). Feature 2.4
CI badge resumes once Gemini ships `.github/workflows/<file>.yml`.

### Scope confirmation

No cross-ownership edits: YES (touched only Claude-owned files this prompt:
`app/error.tsx`, `README.md`, `SUMMARY.claude.md`, `BLOCKERS.claude.md`)
CRM-CONTRACT.md honored: YES (read-only this prompt; no contract edits)

### Type-safety self-scan

`rg '\bany\b|@ts-ignore|@ts-expect-error|as unknown as' app/error.tsx` returned
only one match: the English word "any" in prose ("any client cache"), not the
`any` TypeScript type. Clean.
