# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work.

## Active Items From PLAN.md

| ID | Scope | Owner | Status |
|---|---|---|---|
| S4-F1 | Demo seed tuning | Codex | queued |
| S4-F2 | Route visual QA | Claude | queued |
| S4-F3 | Component polish | Grok | queued |
| S4-F4 | Demo smoke and gate hardening | Gemini | queued |

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
