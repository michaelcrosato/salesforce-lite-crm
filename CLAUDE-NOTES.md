# Claude Notes (feat/claude-crm-ui-e2e)

Working notes for the UI/E2E slice. The contract is `CRM-CONTRACT.md`; this
file captures the patterns and constraints I am working under.

## Domain rules (do not violate)

- Lead is a consumer lead routed to DealerOrder. No B2B Lead -> Account +
  Contact + Opportunity conversion flow.
- Deal is the opportunity-equivalent. Deal detail stays at `/deals?deal=<id>`.
  Per the contract, all new entity detail routes (`/tasks?task=<id>`,
  `/cases?case=<id>`, `/campaigns?campaign=<id>`) follow the same query-param
  drawer pattern, not `/<entity>/[id]`.
- Dealer Revenue Command Center is the vertical differentiator and is
  preserved. New UIs are general CRM surfaces that sit beside it, not on top
  of it.

## Owned paths

- `app/tasks/**`, `app/cases/**`, `app/campaigns/**`, `app/reports/**` (NEW)
- `components/tasks/**`, `components/cases/**`, `components/campaigns/**`,
  `components/reports/**`, `components/command-palette.tsx` (NEW)
- `e2e/tasks.spec.ts`, `e2e/cases.spec.ts`, `e2e/campaigns.spec.ts`,
  `e2e/reports.spec.ts` (NEW)
- `components/sidebar-nav.tsx` (extend ONLY to read from registry)
- `app/layout.tsx` (single edit: mount command palette)
- `CLAUDE-NOTES.md`, `SUMMARY.claude.md`, `BLOCKERS.claude.md`

## Paths I must not touch

- Existing pages: dashboard, contacts, accounts, deals, leads, orders, areas,
  activities, forecast, search.
- Existing components: deal-board, dashboard-charts, activity-timeline,
  account-form, contact-form, deal-form, lead-form, etc.
- `prisma/schema.prisma`, `lib/prisma.ts`, `lib/services/**`, `lib/crm/**`,
  `lib/business/**`, `lib/validation.ts` (Codex/Grok own).
- `prisma/seed.ts` (Grok owns).
- `e2e/smoke.spec.ts` (do not modify).
- `package.json`, `package-lock.json`.

## What Codex delivered (consumed via crmClient)

- `lib/crm/registry.ts`: ENTITY_REGISTRY (11 entities), ROUTE_REGISTRY with
  helper functions for detail routes, plus TASK/CASE/CAMPAIGN status &
  priority constants and types.
- `lib/crm/crmClient.ts`: Promise-based adapter with `list/get/create/update/
delete` for every entity plus `completeTask`, `resolveCase`,
  `completeCampaign`. Input is validated through Zod schemas in
  `lib/validation.ts`.
- `lib/services/tasks.ts` / `cases.ts` / `campaigns.ts`: backing services
  used by crmClient. They define `*ListInput` shapes for filters.
- `lib/services/search.ts`: `globalSearch(query: string)` returning
  `GlobalSearchResults` grouped by entity with `{ id, label, route }`.
  Not currently re-exported by `lib/crm/crmClient.ts`. Since the contract
  does not define a search signature for crmClient, the command palette
  will import `globalSearch` directly from `lib/services/search.ts`.
- `lib/services/reports.ts`: six report queries
  (`pipelineByStage`, `leadsBySource`, `activityVolumeByDay`,
  `topAccountsByOpportunityValue`, `staleOpportunities`, `overdueTasks`).
  Also not yet re-exported by crmClient. I will import from services
  directly for reports, matching the search precedent.
- `lib/services/opportunityStageHistory.ts`: not consumed by UI in this
  slice.
- `app/reports/**` does NOT exist; I need to build it (Feature C6 is in
  scope).

## UI conventions in this repo

- Pages live under `app/<entity>/page.tsx` with optional `[id]/page.tsx`
  detail or `?param=<id>` drawer pattern (depending on the contract).
  `loading.tsx` ships a `Skeleton` placeholder.
- `app/<entity>/new/page.tsx` hosts a stand-alone create form.
- Page top uses `<PageHeader title description>` with right-aligned action
  `<Button>`s as children.
- List pages render `<Card>` containers with a search/filter form in the
  header and a table or empty state in the body.
- Tables are client components that accept an array of row data and use
  the shared `Table*` primitives from `components/ui/table.tsx`.
- Forms use the `ContactForm` shape:
  - "use client" component
  - `useTransition` + `useRouter` + `useToast`
  - submits a FormData via a server action returning `ActionResult`
  - on success shows a success toast, resets the form (create) or calls
    `onSaved` (edit), and `router.refresh()`
- Server actions live in `app/<entity>/actions.ts`. Existing actions go
  through `prisma.*` directly, but for the new entities I will route them
  through `crmClient` because the prompt requires it.
- `EmptyState` for empty list states. `Badge` for status pills (variants:
  default, secondary, outline, success, warning, danger).
- Toasts are shown with `useToast().showToast({ title, description, variant })`.
- Detail drawer pattern is in `components/deal-detail-drawer.tsx`: a fixed
  overlay + side panel triggered by the search-param matching an id;
  the page passes the highlighted id from `searchParams.deal` (or `task`,
  `case`, `campaign`).

## Test selectors I will use

- Page headings via `getByRole("heading", { name: <title>, exact: true })`.
- Form fields via `getByLabel(<label>)`.
- Buttons via `getByRole("button", { name: <submit label> })`.
- Toast surfaces a `<p>` with the title, target via `getByText` if needed.
- Row matching via `getByRole("row").filter({ hasText: ... })`.

## Stopping-rules in play

- max 2 fix attempts per command; on third red, feature-flag off / revert
  and log to BLOCKERS.claude.md.
- After each commit: type scan must return zero matches for `any`,
  `@ts-ignore`, `@ts-expect-error`.

## Baseline gate post-rebase

- `npm run test`: 12 files / 82 tests passing.
- `npm run build`: succeeds; no app/reports route yet (expected).
- `npm run test:e2e`: failed initially because a stale dev server on
  :3000 was reused with a stale prisma connection; after stopping that
  process and re-running, the smoke test passes. Note for the future:
  if the smoke spec fails on "Note for Maya Singh" heading strict-mode
  violation, stop the dev server and re-run.
