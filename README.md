# Salesforce Lite CRM

[![CI Gate](https://github.com/michaelcrosato/salesforce-lite-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/michaelcrosato/salesforce-lite-crm/actions/workflows/ci.yml)

Salesforce Lite CRM is a full-fledged, AI-adaptive Salesforce-style CRM for
small business revenue operations. It combines account, contact, opportunity,
activity, task, case, campaign, lead-routing, dealer-order, forecasting,
reporting, command-palette search, and analyst workflows in a local-first
Next.js and Prisma application.

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
  current prompt/sprint scope, local gate, report schema, and anti-drift rules.
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
- Plan tasks, track cases, and coordinate campaigns tied to CRM records.
- Create opportunities, move stages, and preserve stage-change history.
- Capture notes and generate deterministic AI-style summaries and next steps.
- Search across primary CRM objects from the global Ctrl/Cmd+K command palette.
- Route consumer leads to dealer orders using postal-prefix coverage and quota
  pacing.
- Monitor dealer order delivery, behind-pace accounts, and operational focus
  items.
- Simulate forecast outcomes from pipeline value and lead-delivery assumptions.
- Review built-in reports for pipeline, leads, activity volume, top accounts,
  stale opportunities, and overdue tasks.
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
Postgres and the generated Prisma Client must be produced from the Postgres
schema. SQLite remains the default local workflow until that cutover is
explicitly promoted.

## Core Routes And Workflows

| Route | Workflow |
|---|---|
| `/` | Redirects to `/dashboard`. |
| `/dashboard` | CRM KPIs, pipeline charts, focus lists, Dealer Ops cards, and deterministic analyst actions. |
| `/accounts` | Account list and account health overview. |
| `/accounts/new` | Account creation. |
| `/accounts/<id>` | Account detail with contacts, opportunities, dealer orders, and activity context. |
| `/contacts` | Contact list and CRM relationship context. |
| `/contacts/<id>` | Contact detail, activity history, note capture, and deterministic summary/next-step output. |
| `/deals` | Opportunity board and list using the existing `Deal` model. |
| `/deals/new` | Opportunity creation. |
| `/deals?deal=<id>` | Opportunity detail drawer. There is no live `/deals/[id]` detail route in the current contract. |
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
| `/reports/<slug>` | Report detail for `pipeline-by-stage`, `leads-by-source`, `activity-volume`, `top-accounts`, `stale-opportunities`, and `overdue-tasks`. |

Primary workflows:

- Create a lead with a postal code and inspect the deterministic routing result.
- Review dealer order pacing and lead delivery against monthly quota.
- Open an account to inspect contacts, opportunities, dealer orders, and recent
  activity.
- Add a contact note and review the generated summary and next step.
- Move an opportunity through the board/drawer flow and update forecast values.
- Adjust forecast assumptions to see month-end delivery and pipeline outcomes.
- Use Ctrl/Cmd+K to search accounts, contacts, deals, leads, tasks, cases, and
  campaigns.
- Create or update tasks, cases, and campaigns through their list, new-page,
  and drawer flows.
- Open reports from `/reports` and drill into the supported report slugs.

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
lint             eslint . --max-warnings=0
typecheck        tsc --noEmit --pretty false
seed             tsx prisma/seed.ts
test             vitest run --maxWorkers=1 --minWorkers=1
test:e2e         npm run seed && playwright test
prisma:postgres  node scripts/prisma-postgres.mjs
autonomy:overnight  powershell -ExecutionPolicy Bypass -File scripts/autonomy-loop.ps1
autonomy:watchdog  powershell -ExecutionPolicy Bypass -File scripts/start-codex-overnight.ps1
```

There is no `format` script unless `package.json` later adds one.

## Full Local Gate

Run from the repo root in PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run typecheck
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
- excluded-route placeholders and command-palette shortcut search
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
  implemented as a live detail route.
- Dealer orders and areas are seeded and browsable, but create/edit flows for
  them are deferred.
- The header search form routes to contacts only. Cross-entity search is
  available through the global Ctrl/Cmd+K command palette; there is no dedicated
  `/search` page.
- SQLite is the local default; Postgres is available only through the helper
  path described above and is not the runtime default.
- Postal-prefix matching is intentionally simple and does not use geocoding or
  territory polygons.
- Forecast scenarios are transparent and deterministic, but they do not persist.
- CSV import/export helpers exist in `lib/business`, but there is no shipped
  CSV UI workflow.
- No `Lead` to `Account + Contact + Opportunity` conversion flow — consumer
  leads route to dealer orders instead.

## Roadmap

The canonical roadmap lives in [docs/ROADMAP.md](docs/ROADMAP.md). It records
recommended Sprint 5 scope, deferred promotion candidates, and guardrails for
future scope. Companion docs cover [AI sequencing](docs/AI-ROADMAP.md),
[architecture](docs/ARCHITECTURE.md), [evals](docs/EVALS.md), and
[security/privacy](docs/SECURITY-PRIVACY.md). Current product truth still comes
from `CRM-CONTRACT.md`, `PLAN.md`, and repo-local evidence.

The current tree includes the Sprint 4B demo-hardening surface: seeded demo
anchors, route-level QA hooks, shared component polish, task/case/campaign
workflows, reports, and local gate documentation.

Deferred items such as auth, deployment, external AI, global search expansion,
Postgres runtime cutover, dealer or area CRUD, persistent forecast scenarios,
CSV UI workflows, and any future `/deals/[id]` route require explicit promotion
before implementation.
