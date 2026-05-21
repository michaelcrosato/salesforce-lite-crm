# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work.

## Active Items From PLAN.md

| ID | Scope | Owner | Status |
|---|---|---|---|
| S4-F1 | Demo seed tuning | Codex | done |
| S4-F2 | Route visual QA | Claude | queued |
| S4-F3 | Component polish | Grok | queued |
| S4-F4 | Demo smoke and gate hardening | Gemini | queued |
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
| S12-F1 | CSV export delivery packets | Codex | queued |
| S12-F2 | CSV import dry-run receipts | Codex | queued |

## Deferred README-Known Limitations

- Authentication, permissions, and multi-tenancy.
- Deployment configuration.
- External AI provider integration.
- `/deals/[id]` detail route.
- Dealer order create/edit flows.
- Area create/edit flows.
- Global search expansion beyond contacts.
- Postgres cutover as the default runtime.
- Geocoding or territory polygons.
- Persistent forecast scenarios.
- CSV product UI, bulk import writes, file storage, mapping wizard, and
  Salesforce-connected import/export remain deferred while Sprint 12 queues
  read-only CSV export delivery packets and import dry-run receipts.

## Implemented Contract Routes

`CRM-CONTRACT.md` defines `/tasks`, `/cases`, `/campaigns`, and `/reports` as
live routes. App-router pages are present in this worktree and are covered by
Vitest or Playwright checks. Detail flows for tasks, cases, campaigns, and deals
use query-parameter drawers rather than bracketed dynamic detail routes.

## Do Not Build During Readiness

- Product routes
- Auth or permissions
- Deployment
- External AI or Salesforce integration
- New dealer order or area CRUD
- New `/deals/[id]`
- Global search expansion
