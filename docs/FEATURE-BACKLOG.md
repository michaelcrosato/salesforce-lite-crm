# Feature Backlog

This file records verified repo facts and deferred items only. It is not a
roadmap and does not authorize feature work.

## Active Items From PLAN.md

| ID    | Scope                         | Owner  | Status |
| ----- | ----------------------------- | ------ | ------ |
| S4-F1 | Demo seed tuning              | Codex  | queued |
| S4-F2 | Route visual QA               | Claude | queued |
| S4-F3 | Component polish              | Grok   | queued |
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

## Contract Routes Pending UI Phase

`CRM-CONTRACT.md` defines `/tasks`, `/cases`, and `/campaigns` as contract
routes. App-router pages are not present in this worktree at readiness time.
Do not claim those UI pages exist until files are added under `app/`.

## Do Not Build During Readiness

- Product routes
- Auth or permissions
- Deployment
- External AI or Salesforce integration
- New dealer order or area CRUD
- New `/deals/[id]`
- Global search expansion
