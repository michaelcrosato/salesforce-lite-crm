# Five-Minute Demo Walkthrough - Salesforce Lite CRM

This walkthrough is the canonical local demo path for the current `main` tree.
It assumes a deterministic local seed, no auth, and no external AI provider.
Step times are cumulative from the moment the operator opens the app.

## Before You Start

- Reset state: `npm run seed`
- Optional fast confidence check: `npm run test && npm run build`
- Full gate when time allows: `pwsh -File scripts/local-gate.ps1`
- Start the dev server: `npm run dev`
- Open at <http://localhost:3000>; `/` redirects to `/dashboard`.

If the dev server was already running before `npm run seed`, restart it. A
stale Prisma connection can make the browser show pre-reset data.

## Seed Anchors Audited 2026-05-19

After `npm run seed`, the dashboard and reports should reflect these current
anchors:

- Total contacts: `25`
- Active accounts: `7`
- Open deals: `14`
- Open pipeline: `$1,366,000`
- Weighted forecast: `$698,450`
- Stale deals: `5`
- Activity records created in the last 7 days: `25`
- Leads this month: `70`
- Unrouted leads: `15`
- Active dealer orders: `15`
- Behind-pace orders: `14`
- Orders at quota: `1`
- Recent routed leads: `35`

Seeded object counts are `10` accounts, `25` contacts, `18` deals, `80` leads,
`20` dealer orders, `12` areas, `48` tasks, `20` cases, `10` campaigns, and
`125` activities.

## Step 0:30 - Dashboard

- Open `/dashboard`.
- Show CRM KPI cards, pipeline charts, Analyst Panel, Dealer Ops cards, Dealer
  Ops Focus, and Today's Focus.
- Expected: the values above are visible, and the Analyst Panel includes
  behind-pace orders, unrouted leads, stale high-value deals, low-health dealer
  accounts, and deterministic "Do Today" actions.

## Step 1:00 - Drop A Lead

- Navigate to `/leads`.
- Fill the lead form with a simple demo contact and postal code `V5K 0A1`.
  Example: first name `Demo`, last name `Buyer`, email
  `demo.buyer@example.test`, province `BC`, source `web`.
- Submit the form.
- Expected: the lead is saved, normalized to the Vancouver postal-prefix path,
  and routed to an active Vancouver dealer order.

On a fresh 2026-05-19 seed, a newly created `V5K 0A1` lead resolves to
`Vancouver Metro` and selects `Vancouver fleet lead package` for
`Northstar Freight` because that order is most behind pace among eligible
Vancouver orders.

## Step 1:30 - Inspect The Routing Decision

- In `/leads`, expand the "Routing decision" panel on the new row.
- Expected decision trace:
  1. `normalize` - postal normalized to `V5K 0A1`
  2. `extract_prefix` - prefix `V5K`
  3. `match_area` - `Vancouver Metro`
  4. `filter_orders` - two active Vancouver candidate orders
  5. `rank_pace_gap` - `Vancouver fleet lead package` ranks first on a fresh seed
  6. `select` - selected order id `dealer-order-vancouver-northstar`

## Step 2:15 - Deal Board

- Navigate to `/deals`.
- Open an opportunity drawer via a card or row link.
- Move a deal through the board or stage control.
- Expected: visible stage changes persist, probability follows stage defaults,
  and `OpportunityStageHistory` records the move. Deal detail remains the
  `/deals?deal=<id>` drawer flow; there is no live `/deals/[id]` page.

## Step 3:00 - Tasks, Cases, Campaigns, And Reports

- Navigate to `/tasks`, `/cases`, and `/campaigns`.
- Show filters, list rows, new-page creation links, and query-string drawer
  detail flows.
- Navigate to `/reports`.
- Expected report slugs are `pipeline-by-stage`, `leads-by-source`,
  `activity-volume`, `top-accounts`, `stale-opportunities`, and
  `overdue-tasks`.

## Step 4:00 - Command Palette And Analyst View

- Press Ctrl/Cmd+K.
- Search for an account, contact, deal, lead, task, case, or campaign and open
  a result.
- Return to `/dashboard`.
- Expected: the command palette searches across core CRM objects, while the
  header search box remains contact-only. Analyst recommendations remain local
  and deterministic.

## Step 4:30 - Forecast

- Navigate to `/forecast`.
- Adjust the lead-volume multiplier or assignment rate.
- Expected: forecast values update transparently in the browser and do not
  persist after reset.

## Known Limitations For Reviewers

- No authentication, permissions, or multi-tenancy.
- No deployment pipeline or hosting configuration.
- No external AI provider integration. Summarizer, routing, analyst, and
  forecast are deterministic local code.
- No geocoding or territory polygons. Postal-prefix matching only.
- No persistent forecast scenarios. Simulator state is in-memory.
- No dealer-order or routing-area create/edit flows. Orders and areas are
  seeded and browsable.
- No `/deals/[id]` detail route. Deal detail uses the drawer at
  `/deals?deal=<id>`.
- No dedicated `/search` page. Use Ctrl/Cmd+K for cross-entity search.
- CSV import/export helper functions exist, but no CSV UI workflow ships.
- Lead to Account + Contact + Opportunity conversion is out of scope for this
  dealer-order routing vertical.

## Reset For The Next Demo

```powershell
npm run seed
```

The seed is deterministic for the same audit date. Date-relative counts such as
activity windows and pacing gaps should be re-audited when the demo date moves.
