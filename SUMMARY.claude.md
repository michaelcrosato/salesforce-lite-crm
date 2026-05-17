# Claude Summary (feat/claude-crm-ui-e2e)

## Shipped
- C1 (`feat(ui): tasks list detail and form`) — `/tasks` list with status / owner / due-date filters,
  drawer detail via `/tasks?task=<id>`, `/tasks/new` create form, status update via
  `completeTask` (when done) or `updateTask`, delete.
- C2 (`feat(ui): cases list detail and form`) — `/cases` list with status / account / owner
  filters, drawer detail via `/cases?case=<id>`, `/cases/new` create form, status update
  via `resolveCase` (when resolved) or `updateCase`, delete.
- C3 (`feat(ui): campaigns list detail and form`) — `/campaigns` list with status / start-date
  filters, drawer detail via `/campaigns?campaign=<id>`, `/campaigns/new` create form, status
  update via `completeCampaign` (when completed) or `updateCampaign`, delete.
- C4 (`feat(ui): registry-driven sidebar nav`) — `components/sidebar-nav.tsx` keeps every
  existing nav item; appends Tasks, Cases, Campaigns (derived from `ENTITY_REGISTRY`) plus a
  Reports link.
- C5 (`feat(ui): global command palette`) — `components/command-palette.tsx` cmd/ctrl+K
  modal that calls `globalSearch` via a `components/command-palette-action.ts` server action
  and renders grouped results. Mounted once in `app/layout.tsx` (the single permitted edit
  outside owned paths).
- C6 (`feat(ui): reports index and detail pages`) — `/reports` index with six report cards;
  `/reports/[slug]` dynamic detail page rendering each report as a plain table. Reads
  service helpers from `lib/services/reports.ts`.
- C7 (`test(ui): e2e coverage for tasks cases campaigns reports`) — four new Playwright
  specs creating an entity, editing its status (or dates), and verifying the new state in
  the list. `e2e/smoke.spec.ts` untouched.

## Blocked / deferred
- None. All seven features shipped.

## Gate status
- `npm run test`: 12 files / 82 tests passing.
- `npm run build`: succeeds; routes include `/tasks`, `/tasks/new`, `/cases`, `/cases/new`,
  `/campaigns`, `/campaigns/new`, `/reports`, `/reports/[slug]`.
- `npm run test:e2e`: 5 / 5 passing — smoke + tasks + cases + campaigns + reports.
- Type discipline scan over `app/{tasks,cases,campaigns,reports}` and
  `components/{tasks,cases,campaigns,reports,command-palette*}` and `e2e/*.spec.ts`:
  zero matches for `any`, `@ts-ignore`, `@ts-expect-error`.

## Notes for future agents
- New entity detail routes use the query-param drawer pattern (`/tasks?task=<id>` etc.) per
  the contract — do not add `/<entity>/[id]` routes for tasks, cases, or campaigns. The
  same rule was already established for `/deals?deal=<id>` and is part of the vertical's
  shape.
- Drawer overlays carry `aria-label="Close <entity> detail"`. The drawer's X button has no
  aria-label and the overlay sits behind the panel, so do not click the overlay button
  from e2e specs — navigate back to the list to verify state changes.
- `globalSearch` is in `lib/services/search.ts` and is not re-exported through
  `lib/crm/crmClient.ts`. The command palette imports it via a co-located server action,
  not directly from the client bundle.
- Reports service helpers (`lib/services/reports.ts`) are also imported directly by the
  report pages, not through crmClient — the contract does not define crmClient signatures
  for reports.
- Pre-existing dev server on port 3000 can hold a stale prisma connection that breaks the
  smoke spec on first run. If e2e starts red with a "Note for Maya Singh" strict-mode
  violation, stop the dev server and re-run.
