# Salesforce Lite CRM

Salesforce Lite CRM is a local proof-of-concept CRM built with Next.js, Prisma, SQLite, Tailwind CSS, and deterministic AI-style note summarization. It proves the daily sales loop: manage accounts and contacts, move deals through a pipeline, record activities, generate simple next steps from rough notes, and run a dealer revenue command center for lead routing and order pacing.

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

Routing is deterministic. The app normalizes the postal code, resolves the matching area from `Area.postalPrefixes`, filters active dealer orders linked to that area, excludes orders already at monthly quota, then chooses the order most behind monthly pace. Every route attempt writes a `routing_event` activity explaining either the selected order or the failure reason.

Pacing compares delivered current-month leads against the dealer order quota and expected day-of-month progress. Orders are labeled behind, on pace, ahead, or over.

## Scripts

```bash
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Five-Minute Demo Script

1. Open `/dashboard` and review KPI cards, pipeline charts, stale deals, Today's Focus, Dealer Ops cards, and Dealer Ops Focus.
2. Go to `/contacts`, search for a contact, then open Maya Singh.
3. Add a rough note such as `Follow up next week with pricing and decision maker details.`
4. Confirm the activity timeline shows the raw note summary and deterministic next step.
5. Go to `/deals`, drag a deal from New to Qualified or use the card stage selector, then confirm the card moves with an updated probability and status-change activity.
6. Go to `/leads`, create a lead with postal code `V5K 0A1`, and confirm it routes to the Vancouver dealer order.
7. Go to `/orders`, confirm the assigned order's delivered count and pacing bar updated, then open the order detail to see the lead and routing event.
8. Open `/areas` to review the seeded postal-prefix coverage.
9. Open `/activities` and filter by Routing Event, Note, or Status Change to see the cross-object timeline.

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

Playwright covers one smoke test:

- dashboard load
- contact detail navigation
- note creation and summarization
- deal board drag-and-drop stage update
- Dealer Ops dashboard cards
- lead creation and routing
- dealer order pacing/detail verification

## Known Limitations

- No authentication, permissions, or multi-tenant separation.
- The summarizer is deterministic and local; it is intentionally not an LLM integration.
- Deal detail is a drawer on `/deals`, not a separate `/deals/[id]` route.
- Dealer orders and areas are seeded and browsable, but this sprint does not include create/edit flows for them.
- The top search routes to contacts only.
- SQLite is used for local proof-of-concept data, not production operations.
- Postal prefix matching is deliberately simple and does not use geocoding or territory polygons.

## Switching to Postgres

SQLite remains the default local workflow. To prepare a Postgres database, set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
npm run prisma:postgres
```

The `prisma:postgres` script temporarily copies `prisma/schema.postgres.prisma` over `prisma/schema.prisma`, runs `prisma generate` and `prisma db push`, then restores the SQLite schema file. At actual switch time, `lib/prisma.ts` also needs to swap from the SQLite adapter to a Postgres-compatible Prisma Client configuration.

## Next Recommended Build Step

Add dealer order and area admin screens with validation and audit activities, while keeping deterministic routing as the default assignment path.
