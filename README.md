# Salesforce Lite CRM

[![CI Gate](https://github.com/michaelcrosato/salesforce-lite-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/michaelcrosato/salesforce-lite-crm/actions/workflows/ci.yml)

Salesforce Lite CRM is a full-fledged, AI-adaptive Salesforce-style CRM for
small business revenue operations. It combines account, contact, opportunity,
activity, lead-routing, dealer-order, forecasting, and analyst workflows in a
local-first Next.js and Prisma application.

This repository is no longer framed as a demo or proof-of-concept. It is a CRM
application foundation designed for autonomous AI coding agents to customize for
small business requirements while preserving a shared product contract,
repeatable local gate, and clear ownership boundaries.

## Demo

A five-minute reviewer walkthrough lives in [DEMO.md](DEMO.md). It assumes a
freshly seeded local database and a running dev server. One-click reset:

```powershell
npm run seed
```

## Read First For AI Agents

Start with these files before changing code or documentation:

- `PLAN.md` - execution rules, source-of-truth hierarchy, ownership zones,
  Sprint 4 scope, local gate, report schema, and anti-drift rules.
- `CRM-CONTRACT.md` - entity names, route contract, status values, registry
  exports, and server-side adapter signatures.
- `AGENTS.md` - short handoff for CLI agents, worktree paths, branch
  conventions, and max-YOLO operating policy.
- `docs/PROJECT-CONTROL.md` - current readiness status and coordination notes.
- `docs/MERGE-PLAYBOOK.md` - merge checks, rollback/archive procedure, and
  final-gate expectations.
- `docs/LOCAL-GATE.md` - authoritative local setup and validation commands.
- `prompts/README.md` - policy for versioned prompt artifacts.

Agents should work from repo-local evidence, keep changes scoped, record
cross-zone exceptions in their own `SUMMARY.<agent>.md` and
`BLOCKERS.<agent>.md`, and treat the PowerShell local gate as the pass/fail
authority.

## What The CRM Does

The application supports the core operating loop for a small business revenue
team:

- Manage accounts, contacts, opportunities, and activity history.
- Create opportunities, move stages, and preserve stage-change history.
- Capture notes and generate deterministic AI-style summaries and next steps.
- Route consumer leads to dealer orders using postal-prefix coverage and quota
  pacing.
- Monitor dealer order delivery, behind-pace accounts, and operational focus
  items.
- Simulate forecast outcomes from pipeline value and lead-delivery assumptions.
- Expose deterministic analyst recommendations without relying on an external
  AI provider.

The codebase is intentionally structured so AI coding agents can adapt the CRM
to vertical-specific workflows, reports, copy, seeded data, and UI polish while
respecting `CRM-CONTRACT.md` and the current sprint boundaries.

## Setup

Run from the repository root in PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

## Database Notes

- SQLite is the default local database.
- `.env.example` sets `DATABASE_URL="file:./prisma/dev.db"`.
- `lib/prisma.ts` uses `@prisma/adapter-better-sqlite3` for the local runtime.
- `prisma/seed.ts` creates users, accounts, contacts, opportunities, areas,
  dealer orders, leads, and CRM/routing activities for local development.
- Local SQLite files under `prisma/dev.db*` are generated artifacts and should
  not be committed.

Useful database commands:

```powershell
npx prisma generate
npx prisma db push
npm run seed
```

### Postgres Switching Notes

The repo includes `prisma/schema.postgres.prisma` and a helper script:

```powershell
npm run prisma:postgres
```

That script temporarily copies the Postgres schema over `prisma/schema.prisma`,
runs `prisma generate` and `prisma db push`, then restores the SQLite schema.
For an actual production Postgres cutover, `DATABASE_URL` must point at
Postgres and `lib/prisma.ts` still needs to move from the SQLite adapter to a
Postgres-compatible Prisma Client configuration. SQLite remains the default
local workflow until that cutover is explicitly promoted.

## Core Routes And Workflows

| Route | Workflow |
|---|---|
| `/dashboard` | CRM KPIs, pipeline charts, focus lists, Dealer Ops cards, and deterministic analyst actions. |
| `/accounts` | Account list and account health overview. |
| `/accounts/new` | Account creation. |
| `/accounts/<id>` | Account detail with contacts, opportunities, dealer orders, and activity context. |
| `/contacts` | Contact list and CRM relationship context. |
| `/contacts/<id>` | Contact detail, activity history, note capture, and deterministic summary/next-step output. |
| `/deals` | Opportunity board and list using the existing `Deal` model. |
| `/deals/new` | Opportunity creation. |
| `/deals?deal=<id>` | Opportunity detail drawer. There is no `/deals/[id]` route in the current contract. |
| `/activities` | Activity timeline for notes, calls, emails, meetings, status changes, and routing events. |
| `/leads` | Consumer lead creation and dealer-order routing. |
| `/leads/<id>` | Lead detail and status updates. |
| `/orders` | Dealer order pacing and quota overview. |
| `/orders/<id>` | Dealer order detail with delivered leads and routing events. |
| `/areas` | Postal-prefix routing coverage. |
| `/forecast` | Pipeline and dealer delivery forecast simulator. |
| `/tasks` | Task list with filters; detail via `/tasks?task=<id>` drawer. |
| `/tasks/new` | Task creation. |
| `/cases` | Case list with filters; detail via `/cases?case=<id>` drawer. |
| `/cases/new` | Case creation. |
| `/campaigns` | Campaign list with filters; detail via `/campaigns?campaign=<id>` drawer. |
| `/campaigns/new` | Campaign creation. |
| `/reports` | Report index with KPI cards. |
| `/reports/<slug>` | Report detail for a named report slug. |

Primary workflows:

- Create a lead with a postal code and inspect the deterministic routing result.
- Review dealer order pacing and lead delivery against monthly quota.
- Open an account to inspect contacts, opportunities, dealer orders, and recent
  activity.
- Add a contact note and review the generated summary and next step.
- Move an opportunity through the board/drawer flow and update forecast values.
- Adjust forecast assumptions to see month-end delivery and pipeline outcomes.

Task, Case, and Campaign entities are now wired into the app-router pages
listed above. Detail flows for those entities use the drawer pattern
(`/<entity>?<entity>=<id>`) to stay consistent with the existing `/deals`
drawer flow.

## Dealer Revenue Command Center

Dealer Revenue Command Center capabilities are implemented without external
services:

- Lead creation with postal-code normalization.
- Area resolution from `Area.postalPrefixes`.
- Active dealer-order filtering by linked area, lifecycle status, and monthly
  quota availability.
- Deterministic assignment to the active dealer order that is most behind
  expected monthly pace.
- `routing_event` activity records for successful assignments and failure
  reasons.
- Order pacing labels for behind, on pace, ahead, and over-quota states.
- Dashboard Dealer Ops KPI cards and focus lists.
- Dealer order detail pages with current-month delivered leads and routing
  history.
- Forecast simulation for lead volume, assignment rate, and month-end order
  delivery.
- Deterministic analyst ranking for behind-pace orders, unrouted leads, stale
  high-value opportunities, and low-health dealer accounts.

## Scripts

Current `package.json` scripts:

```text
postinstall      node scripts/ensure-sqlite-db.mjs
dev              next dev
build            next build
seed             tsx prisma/seed.ts
test             vitest run --maxWorkers=1 --minWorkers=1
test:e2e         npm run seed && playwright test
prisma:postgres  node scripts/prisma-postgres.mjs
```

There are no `lint`, `typecheck`, or `format` scripts unless `package.json`
later adds them.

## Full Local Gate

Run from the repo root in PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

The helper script mirrors this sequence:

```powershell
scripts/local-gate.ps1
```

## Test Coverage

Vitest (`npm run test`) covers deterministic server-side and contract logic,
including:

- forecast math and weighted pipeline calculations
- stale-opportunity and focus ranking logic
- activity summarization and next-step generation
- stage-to-probability behavior
- validation schemas and form-action behavior
- list query filtering, sorting, and pagination helpers
- account, contact, opportunity, lead, activity, task, case, campaign, and
  report service behavior
- postal-code normalization, area resolution, pace-gap ranking, and lead routing
- deterministic analyst and forecast simulator outputs

Playwright (`npm run test:e2e`) covers user-visible CRM flows, including:

- dashboard load and primary navigation
- contact detail navigation
- note creation and deterministic summary rendering
- opportunity drawer/query behavior and drag-and-drop stage movement
- lead creation, lead detail, status updates, and routing feedback
- Dealer Ops dashboard cards
- dealer order pacing/detail verification
- forecast simulator input changes
- toast/result feedback
- task, case, and campaign creation and status updates via drawer flow
- report index and detail rendering
- screenshot smoke coverage for stable dashboard and area views

## Known Limitations

- No authentication, permissions, or multi-tenant separation.
- No deployment configuration is included.
- No Salesforce integration is included.
- Deterministic AI-style summarization and analyst output remain local defaults;
  there is no external AI provider integration.
- `Lead` means a consumer lead routed to a dealer order, not a generic B2B
  lead-conversion object.
- Deal detail stays in the `/deals?deal=<id>` drawer flow; `/deals/[id]` is not
  implemented.
- Dealer orders and areas are seeded and browsable, but create/edit flows for
  them are deferred.
- Top search routes to contacts only.
- SQLite is the local default; Postgres is available only through the helper
  path described above and is not the runtime default.
- Postal-prefix matching is intentionally simple and does not use geocoding or
  territory polygons.
- Forecast scenarios are transparent and deterministic, but they do not persist.
- No CSV import/export.
- No `Lead` to `Account + Contact + Opportunity` conversion flow — consumer
  leads route to dealer orders instead.

## Roadmap

Sprint 4 is queued for focused hardening of the existing product surface:

- S4-F1 - Codex: tune seed data for the reference CRM workflow.
- S4-F2 - Claude: route-level visual QA for implemented CRM pages.
- S4-F3 - Grok: shared component polish for stable spacing, empty states, and
  deterministic ordering.
- S4-F4 - Gemini: smoke and gate hardening for Vitest, Playwright, and local
  validation.

Deferred backlog items include Postgres runtime cutover readiness, auth and
permissions, deployment configuration, broader global search, persistent
forecast scenarios, dealer order and area CRUD, optional external AI provider
integration, and any future `/deals/[id]` route.
