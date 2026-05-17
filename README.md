# Salesforce Lite CRM

Salesforce Lite CRM is a local proof-of-concept CRM built with Next.js, Prisma, SQLite, Tailwind CSS, and deterministic AI-style note summarization. It proves the daily sales loop: manage accounts and contacts, move deals through a pipeline, record activities, generate simple next steps from rough notes, and run a dealer revenue command center for lead routing and order pacing.

## Project Control

Read these first when working as a CLI agent:

- `PLAN.md` - execution rules, source-of-truth hierarchy, agent zones, gate, report schema, and current sprint status.
- `CRM-CONTRACT.md` - entity names, route contract, statuses, and adapter signatures. If a branch does not have this file yet, use `README.md`, `PLAN.md`, and `docs/decisions.md` as interim references and do not invent a replacement contract.
- `AGENTS.md` - short agent handoff with worktree paths, branch conventions, zones, and max-YOLO operating policy.
- `docs/PROJECT-CONTROL.md` - current repo readiness status and next coordination step.
- `docs/MERGE-PLAYBOOK.md` - merge, conflict, rollback/archive, and final-gate procedure.
- `docs/DEMO-QA-CHECKLIST.md` - verified demo route checklist.
- `docs/WORKTREE-SETUP.md` - expected worktree topology and safe creation commands.
- `docs/LOCAL-GATE.md` - full local gate commands.
- `prompts/README.md` - versioned prompt folder policy.

The repo is configured for autonomous max-YOLO execution. The current prompt can authorize a one-run exception, but agents should keep changes scoped, document exceptions in SUMMARY/BLOCKERS, and preserve the local gate as the authority for pass/fail.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Database

The app uses SQLite through Prisma. The default local database is `prisma/dev.db`.

Useful commands:

```bash
npx prisma generate
npx prisma db push
npm run seed
```

The seed creates 3 users, 10 accounts, 25 contacts, 18 deals, 12 routing areas, 20 dealer orders, 80 leads, and historical CRM plus routing activities.

## Dealer Revenue Command Center

Sprint 3B adds dealer lead-gen operations without external services:

- `/leads` creates leads with postal codes and shows assignment reason badges.
- `/orders` shows dealer order pacing against monthly quota.
- `/orders/[id]` shows assigned leads this month and routing events.
- `/areas` lists postal-prefix routing coverage.
- `/dashboard` includes Dealer Ops KPI cards and a Dealer Ops Focus list.
- `/forecast` simulates month-end dealer order delivery under lead-volume and assignment-rate assumptions.

Routing is deterministic. The app normalizes the postal code, resolves the matching area from `Area.postalPrefixes`, filters active dealer orders linked to that area, excludes orders already at monthly quota, then chooses the order most behind monthly pace. Every route attempt writes a `routing_event` activity explaining either the selected order or the failure reason.

Pacing compares delivered current-month leads against the dealer order quota and expected day-of-month progress. Orders are labeled behind, on pace, ahead, or over.

The analyst panel is deterministic. It ranks behind-pace orders, unrouted leads, stale high-value deals, and low-health dealer accounts from the database, then produces five linked actions for the demo operator.

## Scripts

```bash
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Full local gate:

```bash
npm install
cp .env.example .env # if .env is missing
npx prisma generate
npx prisma db push
npm run seed
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

There are no `lint`, `typecheck`, or `format` package scripts in this repo at this time.

## Five-Minute Demo Script

1. Open `/dashboard`.
2. Show CRM KPIs, Dealer Ops cards, Today's Focus, Dealer Ops Focus, and the Analyst Panel.
3. Go to `/leads`.
4. Create a lead with postal code `V5K 0A1`.
5. Show it routes to the active Vancouver order most behind pace.
6. Open the assigned `/orders/[id]`.
7. Show the pacing bar, delivered count, and the new lead.
8. Open the related account.
9. Show contacts, deals, and activity context.
10. Add a contact note.
11. Show deterministic summary and next step.
12. Go to `/deals`.
13. Move a deal stage using the existing board or drawer flow.
14. Show forecast and pipeline values update.
15. Go to `/forecast`.
16. Change the lead-volume multiplier.
17. Show which orders hit, miss, or over-deliver.
18. Run `npm run test`, `npm run build`, and `npm run test:e2e`.

## Tests

Vitest covers:

- weighted forecast calculation
- stale deal detection
- today's focus ranking
- activity summarization
- stage-to-probability mapping
- postal code normalization and prefix parsing
- area resolution
- dealer order pace-gap ranking
- lead routing outcomes
- deterministic analyst ranking
- forecast simulator projections

Playwright covers one smoke test:

- dashboard load
- contact detail navigation
- note creation and summarization
- deal board drag-and-drop stage update
- Dealer Ops dashboard cards
- lead creation and routing
- dealer order pacing/detail verification
- analyst panel rendering
- forecast simulator multiplier updates
- toast feedback for deal movement

## Known Limitations

- No authentication, permissions, or multi-tenant separation.
- The summarizer is deterministic and local; it is intentionally not an LLM integration.
- Deal detail is a drawer on `/deals`, not a separate `/deals/[id]` route.
- `Lead` means a consumer lead routed to a dealer order, not a generic B2B lead conversion object.
- Dealer orders and areas are seeded and browsable, but this sprint does not include create/edit flows for them.
- The top search routes to contacts only.
- SQLite is used for local proof-of-concept data, not production operations.
- Postal prefix matching is deliberately simple and does not use geocoding or territory polygons.
- The forecast simulator is transparent and deterministic; it does not persist scenarios.
- `/tasks`, `/cases`, and `/campaigns` are contract routes for the next UI phase; they are not claimed as implemented app-router pages here unless files exist under `app/`.

## Switching to Postgres

SQLite remains the default local workflow. To prepare a Postgres database, set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
npm run prisma:postgres
```

The `prisma:postgres` script temporarily copies `prisma/schema.postgres.prisma` over `prisma/schema.prisma`, runs `prisma generate` and `prisma db push`, then restores the SQLite schema file. At actual switch time, `lib/prisma.ts` also needs to swap from the SQLite adapter to a Postgres-compatible Prisma Client configuration.

## Next Recommended Build Step

For Tuesday, focus on demo data tuning and visual QA rather than adding new product scope.
