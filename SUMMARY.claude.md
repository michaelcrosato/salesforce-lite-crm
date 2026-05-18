Agent: claude
Sprint: 4B
Feature: Sprint 4B complete on Claude side — all features shipped, all Claude-filed blockers resolved
Branch: feat/claude-demo-and-route-polish
Status: done
Commits this prompt: eb2af97 merge(claude): consume gemini ci workflow; fb6cee2 docs(claude): add ci badge to readme
Gate status: PASS — pwsh scripts/local-gate.ps1 reports "Local gate completed successfully" (vitest expanded, next build clean, playwright 19 passed + 1 skipped including new excluded-routes spec)
DoD self-check: PASS
Timestamp: 2026-05-18T11:10:00-08:00

### Completed this prompt

- Merged Gemini final integration tip `3879aaf gemini/sprint-4-demo-smoke-gate-hardening`
  into this branch. This pulled in `.github/workflows/ci.yml` (the "CI Gate"
  workflow), Gemini's e2e additions (`demo-path.spec.ts`,
  `excluded-routes.spec.ts`), `scripts/local-gate.sh`,
  `tests/api/crmClient-lists.test.ts`, `tests/seed/demo-anchors.test.ts`, plus
  Codex's `EXCLUDED_ROUTES` reconciliation (Gemini's merge chain
  `6804fb9 merge(gemini): consume codex excluded-route reconciliation` is
  inside the Gemini branch). `EXCLUDED_ROUTES` now lists only the 7 routes
  that have no live page — exactly matching the 7 placeholder pages Claude
  shipped in Feature 2.1.
- Added the README CI badge near the top of `README.md`, pointing at
  `https://github.com/michaelcrosato/salesforce-lite-crm/actions/workflows/ci.yml`
  (URL derived from `git remote -v`, since `package.json` has no `repository`
  field). Badge text "CI Gate" matches the workflow name in `ci.yml`.
- Marked BLOCKERS #7 (Gemini CI workflow) and BLOCKERS #5 (Codex
  EXCLUDED_ROUTES reconciliation) as resolved. All Claude-filed blockers are
  now closed.

### Carried forward from prior prompts

### Carried forward from prior prompt

- Consumed Codex `[UNBLOCK LIB]` and Grok `[UNBLOCK COMPONENTS]` by merging
  `feat/grok-components-and-seed-tuning` (which already merged
  `feat/codex-services-routing-and-validation` at Grok HEAD `0a11563`) into this
  branch; then merged `gemini/sprint-4-demo-smoke-gate-hardening` for the e2e
  gate fixes.
- Fixed merge-fallout regression in three Claude-owned pages: `app/tasks/page.tsx`,
  `app/cases/page.tsx`, `app/campaigns/page.tsx`. Codex's new contract for
  `Task/Case/CampaignListInput` is `ListQueryInput<TSort, TFilters>` (i.e.,
  `{ pageSize, filters: { ... } }`); the pages still used the legacy bespoke
  shape `{ status, ownerId, ..., take }`. Migration kept the same filter set per
  page, just nested under `filters` and replaced `take` with `pageSize`.
- Feature 2.1 (broken-link guards): added 7 placeholder pages — `app/deals/[id]`,
  `app/search`, `app/command-palette`, `app/orders/new`, `app/orders/[id]/edit`,
  `app/areas/new`, `app/areas/[id]/edit`. Each renders Grok's
  `<ExcludedRoutePlaceholder route="..." reason="..." />` with the wrapper
  `data-testid="excluded-route-placeholder"` and `data-route="<route>"` for
  Gemini's e2e assertions. Did NOT add placeholders for `/tasks`, `/cases`,
  `/campaigns` — those routes ship with full UI on this branch (C1–C3); see
  BLOCKERS #5.
- Feature 2.2 (routing detail wiring): `app/leads/page.tsx` and
  `app/orders/[id]/page.tsx` now fetch `getRoutingDecisionForLead` per visible
  lead (via `lib/crm/crmClient.ts` SSOT adapter) and render Grok's
  `<RoutingDecisionDetail>` inline. Each instance carries
  `data-testid="routing-detail-<leadId>"`. The detail panel is collapsed by
  default; the component owns the toggle interaction.
- Feature 2.3 (postal validation): `app/leads/actions.ts` updated to surface a
  postal-specific toast message when `postalCode` is the only failing field
  during lead creation. The validation chain itself is already complete —
  `leadFormSchema` (Codex) composes `postalCodeSchema` from `lib/postal.ts`, and
  `actions.ts` already returned `fieldErrors` on `safeParse` failure. The form's
  `<Input id="postalCode">` is still a plain input — wiring Grok's
  `<PostalCodeInput>` into `components/lead-form.tsx` is the remaining piece
  (Grok zone; BLOCKERS #9 filed against Grok).
- Feature 2.4 (README — carried from prior turn): `docs(claude): readme demo
  callout and routes refresh` (commit `796f776`) added the Demo callout and
  refreshed the routes table. CI badge still deferred — `.github/workflows/`
  does not exist on this branch (no Gemini CI workflow file to point at);
  BLOCKERS #7 remains active.
- Feature 2.5 (page polish — carried from prior turn): `feat(claude):
  page-level error boundary` (commit `2fb5944`) added the catch-all
  `app/error.tsx`. The `dynamic = "force-dynamic"` audit confirmed all 23
  data-reading pages already have it. Page-wrapper `data-testid` additions
  happened opportunistically this prompt on `/leads` (`page-leads`) and
  `/orders/[id]` (`page-order-detail`) as part of Feature 2.2; the wider pass
  remains deferred until Gemini needs more testids in their specs.
- Feature 2.6 (final audit):
  - `rg '\bany\b|@ts-ignore|@ts-expect-error' app` — clean. Only match is the
    English word "any" in prose at `app/error.tsx:27` ("any client cache").
  - `rg '/deals/\[id\]|...' app` — only matches are the intentional references
    in `app/deals/[id]/page.tsx` (the placeholder page).
  - `rg 'href="/tasks"|href="/cases"|href="/campaigns"' app` — 3 matches at
    `app/{tasks,campaigns,cases}/page.tsx` for `<Link href="/<route>">Reset</Link>`
    filter-reset self-links. These are NOT broken nav links — they clear
    querystring filters on routes that legitimately exist on this branch
    (C1–C3 shipped them). The CLAUDE-SPRINT-4B.md scan expectation was that
    these routes would not exist; on this branch they do, and these self-links
    are correct. Carrying BLOCKERS #5 forward.
  - Full gate: PASS.

### Sprint 4B testid catalog (new this sprint, for Gemini)

- `excluded-route-placeholder` — wrapper on all 7 broken-link guard pages
  (`/deals/[id]`, `/search`, `/command-palette`, `/orders/new`,
  `/orders/[id]/edit`, `/areas/new`, `/areas/[id]/edit`). Combine with
  `data-route="<route>"` to disambiguate per page.
- `routing-detail-<leadId>` — per-lead `<RoutingDecisionDetail>` wrapper. Used
  on `/leads` (one per lead row, in a spanning sub-`<tr>`) and on `/orders/[id]`
  (one per lead in the "Assigned Leads This Month" section). The inner toggle
  button is `data-testid="routing-detail-toggle"` (component-owned; same across
  instances — scope by parent in tests).
- `routing-detail-<leadId>-empty` — fallback wrapper when
  `getRoutingDecisionForLead` returns null. Component-owned.
- `page-leads` — wrapper on `/leads`.
- `page-order-detail` — wrapper on `/orders/[id]`.
- `page-error-boundary`, `page-error-reset`, `page-error-reload` —
  `app/error.tsx` catch-all (added in commit `2fb5944` prior turn).
- `postal-input-error` — component-owned by `<PostalCodeInput>`; available
  once Grok wires the component into `<LeadForm>`.

### Route inventory (current, after Feature 2.1)

`next build` route table reflects 24 + 7 placeholder pages = 31 routes:

Live: `/`, `/dashboard`, `/accounts`, `/accounts/[id]`, `/accounts/new`,
`/activities`, `/areas`, `/contacts`, `/contacts/[id]`, `/deals`, `/deals/new`,
`/forecast`, `/leads`, `/leads/[id]`, `/orders`, `/orders/[id]`,
`/reports`, `/reports/[slug]`, `/tasks`, `/tasks/new`, `/cases`, `/cases/new`,
`/campaigns`, `/campaigns/new`, `/_not-found`.

Placeholder (new this sprint): `/deals/[id]`, `/search`, `/command-palette`,
`/orders/new`, `/orders/[id]/edit`, `/areas/new`, `/areas/[id]/edit`.

### Dependency unblocks consumed

- Codex `[UNBLOCK LIB]` (`336aa6d`) — consumed via Grok merge ancestry.
  Specifically `lib/featureFlags.ts` (EXCLUDED_ROUTES, FEATURE_FLAGS),
  `lib/postal.ts`, `lib/services/leads.ts` (getRoutingDecisionForLead),
  `lib/crm/crmClient.ts` (getRoutingDecision adapter), extended `lib/validation.ts`.
- Grok `[UNBLOCK COMPONENTS]` (`3f7ed00`) and audit (`38aa7c0`) — consumed via
  direct merge. Specifically `<ExcludedRoutePlaceholder>`,
  `<RoutingDecisionDetail>`, `<PostalCodeInput>`, plus other report cards and
  helpers I did not need this prompt.
- Gemini gate fix (`gemini/sprint-4-demo-smoke-gate-hardening`) — consumed via
  direct merge. Visual-smoke snapshots now match; e2e is green on all 11 specs.

### Coordination tension still open

- BLOCKERS #5 — `lib/featureFlags.ts` `EXCLUDED_ROUTES` lists `/tasks`,
  `/cases`, `/campaigns`, but those routes ship with full UI and E2E coverage
  on this branch (C1–C3). My Feature 2.1 honored the live UI and did NOT
  replace those pages with placeholders. Codex's contract and the live UI
  disagree; needs human/IFT decision before merge to main.

### Final action

Sprint 4B Claude scope is complete. Remaining surfaces are not on Claude:
- Codex (and IFT): resolve EXCLUDED_ROUTES content (BLOCKERS #5) — the only
  coordination decision left.
- Gemini: ship `.github/workflows/<file>.yml` so the README CI badge can land,
  and consider an `e2e/excluded-routes.spec.ts` consuming the new
  `data-testid="excluded-route-placeholder"` markers across the 7 placeholder
  pages.
- Grok blocker #9 is resolved this prompt by their `4d34708` / `cf69810` commits.

### Scope confirmation

No cross-ownership edits: YES (this prompt touched only Claude-owned files —
`app/error.tsx` was added prior; this prompt edited `app/{tasks,cases,
campaigns,leads,orders/[id]}/page.tsx`, `app/leads/actions.ts`, the 7 new
`app/<excluded>/page.tsx` placeholder pages, plus the report files. The
merges from Grok and Gemini are merge-commits, not edits of other agents'
files.)
CRM-CONTRACT.md honored: YES (read-only this prompt; no contract edits)
