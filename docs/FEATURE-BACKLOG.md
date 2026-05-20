# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work. Proposed B-NN roadmap entries live
in `PLAN.md` section 16 and `docs/ROADMAP.md`.

## Recently Landed In Main

| ID | Scope | Current state |
|---|---|---|
| S4-F1 | Demo seed tuning | Present in `main` |
| S4-F2 | Route visual QA | Present in `main` |
| S4-F3 | Component polish | Present in `main` |
| S4-F4 | Demo smoke and gate hardening | Present in `main` |

The implemented app-router surface includes `/tasks`, `/tasks/new`, `/cases`,
`/cases/new`, `/campaigns`, `/campaigns/new`, `/reports`, and
`/reports/[slug]`.

## Deferred README-Known Limitations

- Authentication, permissions, and multi-tenancy.
- Deployment configuration.
- Salesforce integration.
- External AI provider integration.
- Dedicated `/search` page. Cross-entity search currently exists through the
  global Ctrl/Cmd+K command palette.
- `/deals/[id]` detail route.
- Dealer order create/edit flows.
- Area create/edit flows.
- Postgres cutover as the default runtime.
- Geocoding or territory polygons.
- Persistent forecast scenarios.
- CSV UI workflow. CSV import/export helper functions exist under
  `lib/business`.
- Lead to Account + Contact + Opportunity conversion. Consumer leads route to
  dealer orders in this vertical.

## Excluded Routes Still Guarded

These routes intentionally render placeholders or 404 responses:

- `/deals/[id]`
- `/search`
- `/command-palette`
- `/orders/new`
- `/orders/[id]/edit`
- `/areas/new`
- `/areas/[id]/edit`

## Do Not Build During Documentation Or Readiness Passes

- Product routes beyond the current contract.
- Auth or permissions.
- Deployment.
- External AI or Salesforce integration.
- New dealer order or area CRUD.
- New `/deals/[id]`.
- Dedicated `/search` page.
