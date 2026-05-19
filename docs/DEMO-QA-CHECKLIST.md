# Demo QA Checklist

Use this checklist for visual and workflow QA. It does not expand product scope.

## Dashboard

- `/dashboard` loads without server or client errors.
- CRM KPI cards show counts and revenue values.
- Dealer Ops cards show lead routing and pacing signals.
- Today's Focus and Dealer Ops Focus show deterministic, linked actions.
- Analyst panel renders deterministic recommendations with relevant links.

## Leads

- `/leads` loads.
- Creating a lead with postal code `V5K 0A1` succeeds.
- The lead routes to an active Vancouver dealer order when capacity exists.
- Routing reason text is visible and understandable.
- Failed routing states remain explainable when no order is eligible.

## Orders

- `/orders` loads.
- Pacing bars and delivered/quota counts render coherently.
- `/orders/[id]` loads for a listed order.
- The order detail page shows assigned leads and routing context.

## Areas

- `/areas` loads.
- Postal-prefix coverage is visible.
- Area/order relationships are understandable from the page content.

## Forecast

- `/forecast` loads.
- Lead-volume multiplier changes update projected order outcomes.
- Hit, miss, and over-deliver states remain readable.

## Accounts

- `/accounts` loads when present in the app router.
- `/accounts/<id>` loads from demo links.
- Account health and related contacts/deals/activity context render coherently.

## Contacts

- `/contacts` loads when present in the app router.
- `/contacts/<id>` loads from demo links.
- Adding a contact note creates an activity.
- The deterministic note summary and next step are visible.

## Deals

- `/deals` loads.
- Deal detail opens through the existing drawer/query flow, not `/deals/[id]`.
- Moving a deal stage updates visible board/drawer state.
- Stage movement feedback is visible.

## Work Queues And Reports

- `/tasks`, `/cases`, and `/campaigns` load and support their drawer detail
  flows through query parameters.
- `/reports` loads.
- A representative `/reports/<slug>` page renders table content or an empty
  state without server or client errors.

## Excluded Routes

- `/deals/[id]`, `/search`, `/command-palette`, `/orders/new`,
  `/orders/[id]/edit`, `/areas/new`, and `/areas/[id]/edit` return 404 or
  render the excluded-route placeholder.
- Ctrl/Cmd+K does not open a command palette while `commandPalette` remains
  excluded.

## Final Gate

Run:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Run the full gate in `docs/LOCAL-GATE.md` before claiming merge readiness.
