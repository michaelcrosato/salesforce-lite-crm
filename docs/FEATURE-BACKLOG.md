# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work. Proposed B-NN roadmap entries live
in `PLAN.md` section 16 and `docs/ROADMAP.md`.

## Recently Landed And Active Sprint Scope

| ID | Scope | Owner | Status |
|---|---|---|---|
| S4-F1 | Demo seed tuning | Codex | done |
| S4-F2 | Route visual QA | Claude | done |
| S4-F3 | Component polish | Grok | done |
| S4-F4 | Demo smoke and gate hardening | Gemini | done |
| S5-F1 | Server CSV export contracts | Codex | done |
| S5-F2 | CSV import preview validation | Codex | done |
| S6-F1 | CSV import template contracts | Codex | done |
| S6-F2 | CSV import preflight diagnostics | Codex | done |
| S7-F1 | CSV capability catalog | Codex | done |
| S7-F2 | CSV preview issue summaries | Codex | done |
| S8-F1 | CSV import example contracts | Codex | done |
| S8-F2 | CSV export preflight summaries | Codex | done |
| S9-F1 | CSV import readiness plans | Codex | done |
| S9-F2 | CSV export preview snippets | Codex | done |
| S10-F1 | CSV import action manifests | Codex | done |
| S10-F2 | CSV preview capability metadata | Codex | done |
| S11-F1 | CSV import review bundles | Codex | done |
| S11-F2 | CSV export review bundles | Codex | done |
| S12-F1 | CSV export delivery packets | Codex | done |
| S12-F2 | CSV import dry-run receipts | Codex | done |
| S13-F1 | CSV transfer manifest catalog | Codex | done |
| S13-F2 | CSV compatibility reports | Codex | done |
| S14-F1 | CSV handoff index | Codex | done |
| S14-F2 | CSV field coverage summaries | Codex | done |
| S15-F1 | CSV operator readiness scorecards | Codex | done |
| S15-F2 | CSV contract QA checks | Codex | done |
| S16-F1 | CSV operator remediation runbooks | Codex | done |
| S16-F2 | CSV contract drift snapshots | Codex | done |
| S17-F1 | CSV operator handoff packets | Codex | done |
| S17-F2 | CSV contract release digest | Codex | done |
| S18-F1 | CSV release verification manifests | Codex | done |
| S18-F2 | CSV operator fixture bundles | Codex | done |
| S19-F1 | CSV handoff release notes packet | Codex | done |
| S19-F2 | CSV operator acceptance checklists | Codex | done |
| S20-F1 | CSV operator walkthrough manifests | Codex | done |
| S20-F2 | CSV release closure scorecards | Codex | done |
| S21-F1 | CSV release handoff catalog | Codex | done |
| S21-F2 | CSV release exception register | Codex | done |
| S22-F1 | CSV release disposition manifests | Codex | done |
| S22-F2 | CSV release readiness packets | Codex | done |
| S23-F1 | CSV dedupe candidate packets | Codex | queued |
| S23-F2 | CSV dedupe review bundles | Codex | queued |

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
- Live `/deals/[id]` detail route.
- Dealer order create/edit flows.
- Area create/edit flows.
- Postgres cutover as the default runtime.
- Geocoding or territory polygons.
- Persistent forecast scenarios.
- CSV product UI, bulk import writes, file storage, mapping wizard, persistent
  CSV release-note/acceptance/verification/fixture/snapshot/walkthrough/scorecard/
  handoff/exception/disposition/readiness history, and Salesforce-connected
  import/export remain deferred; server helpers exist under `lib/server` and
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
- New live `/deals/[id]` detail behavior.
- Dedicated `/search` page.
