# Five-Minute Demo Walkthrough - Salesforce Lite CRM

This walkthrough is the reviewer demo path for the current CRM foundation. It
assumes a freshly seeded local SQLite database, no authentication, and no
external AI provider.

## Before You Start

Run from the repository root:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Open <http://localhost:3000/dashboard>.

For merge readiness, run the full gate in `docs/LOCAL-GATE.md` instead of only
starting the app.

## Step 0:30 - Dashboard

- Open `/dashboard`.
- Show CRM KPI cards, pipeline charts, Dealer Ops cards, focus lists, and
  deterministic analyst actions.
- Point out that recommendations are local deterministic code, not an external
  AI call.

## Step 1:00 - Drop A Lead

- Navigate to `/leads`.
- Create a lead with postal code `V5K 0A1`.
- Expected: the lead normalizes to the Vancouver prefix, routes when an active
  eligible dealer order has capacity, and records routing context.

## Step 1:45 - Inspect Routing And Orders

- Open the new or seeded lead detail at `/leads/<id>`.
- Navigate to `/orders` and open a listed order at `/orders/<id>`.
- Confirm pacing, delivered leads, and routing event context are visible.

## Step 2:45 - Deal Board

- Navigate to `/deals`.
- Open an opportunity through the drawer query flow at `/deals?deal=<id>`.
- Move a deal stage and confirm the visible board or drawer state updates.
- Do not use `/deals/[id]`; there is no live bracketed deal detail route.

## Step 3:30 - Accounts, Contacts, And Activities

- Open `/accounts` and a listed account detail page.
- Open `/contacts` and a listed contact detail page.
- Add a contact note and confirm the deterministic summary and next step appear.
- Open `/activities` to review the activity timeline.

## Step 4:30 - Forecast And Reports

- Navigate to `/forecast` and adjust the simulator assumptions.
- Open `/reports` and a representative report detail page.
- If useful for the review, open `/tasks`, `/cases`, and `/campaigns` to show
  the current supporting CRM work queues.

## Known Limitations

- No authentication, permissions, or multi-tenancy.
- No deployment pipeline or hosting configuration.
- No external AI provider integration.
- No Salesforce integration.
- No geocoding or territory polygons; postal prefix matching is the local
  default.
- No persistent forecast scenarios.
- No dealer-order or routing-area create/edit flows.
- No live `/deals/[id]` detail route; deal detail uses `/deals?deal=<id>`.
- No global search expansion; the top search routes to contacts only.
- No CSV import/export UI.
- No Lead to Account, Contact, and Opportunity conversion flow; this vertical
  routes consumer leads to dealer orders.

## Reset

```powershell
npm run seed
```
