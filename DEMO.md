# Five-Minute Demo Walkthrough — Salesforce Lite CRM

This walkthrough is the canonical demo path for Sprint 4B. It assumes a
deterministic local seed, no auth, and no external AI provider. Step times
are cumulative from the moment the operator opens the app.

## Before you start

- Reset state: `npm run seed`
- Verify gate green (skip e2e for speed):
  `pwsh scripts/local-gate.ps1 --skip-e2e`
  (fallback while Gemini's gate script is in flight: `npm run test && npm run build`)
- Start the dev server: `npm run dev`
- Open at <http://localhost:3000>

If the dev server was already running before `npm run seed`, restart it.
A stale Prisma connection can mask the new seed state and cause the
`smoke.spec.ts` "Note for Maya Singh" strict-mode violation noted in
prior SUMMARY.claude.md handoff notes.

## Step 0:30 — Dashboard (open at /)

- Show pipeline total, weighted forecast, and activity volume.
- Expected numbers: `<TBD from SEED-ANCHORS — pending Grok S4-F1>`
  - Pipeline total: `<TBD>`
  - Weighted forecast: `<TBD>`
  - Activity volume (last 7d): `<TBD>`

Blocker filed on Grok to publish a SEED-ANCHORS section in
`SUMMARY.grok.md` with the canonical demo numbers.

## Step 1:00 — Drop a lead

- Navigate to `/leads`, click "New lead".
- Enter the demo postal code `V5K 0A1` (Vancouver-area FSA used by the
  deterministic routing path; preserved verbatim per CLAUDE.md rule #7).
- Fill in name + email; submit.
- Expected: lead lands in the list, routing decision visible inline on
  the new row (Sprint 4B Item 55 — routing detail panel; wired once
  `[UNBLOCK LIB]` and `[UNBLOCK COMPONENTS]` ship).

## Step 1:30 — Inspect the routing decision

- Click the "Why this routing?" toggle (`data-testid="routing-detail-toggle-{leadId}"`)
  on the new lead row.
- Expected sequence in the detail panel:
  1. **normalize** — postal normalized to `V5K 0A1`
  2. **extract_prefix** — FSA `V5K`
  3. **match_area** — matched area name `<TBD from SEED-ANCHORS>`
  4. **filter_orders** — candidate dealer orders for that area
  5. **rank_pace_gap** — orders ranked by behind-pace gap (largest first)
  6. **select** — winning order id

## Step 2:30 — Deal board

- Navigate to `/deals`.
- Drag one card from the "Negotiation" column to the "Won" column.
  (Drawer detail at `/deals?deal=<id>` remains the canonical detail
  surface — no `/deals/[id]` route per CRM-CONTRACT.md.)
- Expected: card moves, stage history records a row in
  `OpportunityStageHistory` (Item 17, shipped Sprint 4A).

## Step 3:30 — Analyst view

- Navigate to `/dashboard` (analyst recommendations live on the
  dashboard, not a separate `/analyst` route — see "Known limitations").
- Expected: at least one stale opportunity flagged, one overdue task
  surfaced, deterministic ordering (no external AI provider).

## Step 4:30 — Forecast

- Navigate to `/forecast`.
- Expected: weighted forecast value reflects the just-moved deal.
- The forecast simulator is transparent and non-persistent per
  PLAN.md §4.

## Known limitations (reviewer expectation-setting)

Sourced from `PLAN.md` §4 (Sprint 4 non-goals) and `README.md` — single
source of truth for the limitations list.

- No authentication, permissions, or multi-tenancy.
- No deployment pipeline or hosting configuration.
- No external AI provider integration. Summarizer, routing, analyst, and
  forecast are deterministic local code.
- No geocoding or territory polygons. Postal prefix matching only.
- No persistent forecast scenarios. Simulator is in-memory.
- No dealer-order or routing-area create/edit flows. Browse-only.
- No `/deals/[id]` detail route. Deal detail uses drawer at
  `/deals?deal=<id>`.
- No global search expansion. Top search routes to contacts only.
- CSV import/export: deferred (backlog B-NN).
- Lead → Account + Contact + Opportunity conversion: out of scope for
  this vertical (dealer-order routing replaces it; see CRM-CONTRACT.md
  Lead entity note).

## Reset for the next demo

```
npm run seed
```

The seed is deterministic; the same numbers will appear on each run
once Grok's S4-F1 anchor manifest lands.
