Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — list page CardTitle casing alignment
Branch: claude/autonomy
Status: active
Commits this prompt: d51d817 — [claude] S4-F2: align CardTitle casing on list pages
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T06:35:00-08:00

### Completed this prompt

- Continued the S4-F2 visual QA sweep into the non-demo-critical list
  routes flagged in the prior iteration's "Next action".
- Identified one page-level coherence drift across the three drawer-flow
  list pages: the list-section CardTitle strings used sentence case
  ("Task list", "Case list", "Campaign list") while every other
  CardTitle in `app/**` uses Title Case ("Account List", "Contact
  Directory", "Activity Feed", "Pacing Dashboard", "Analyst Panel",
  "Order Summary", etc.).
- Fixed in one atomic commit:
  - `app/tasks/page.tsx` — `Task list` → `Task List`
  - `app/cases/page.tsx` — `Case list` → `Case List`
  - `app/campaigns/page.tsx` — `Campaign list` → `Campaign List`
- All changes are text-only inside `CardTitle` children. No business
  logic, no component primitives, no schema, no route contract
  changes. No new dependencies, no test changes. No cross-zone edits.

### Pattern audit (no further fix needed)

| Route | CardTitle inventory (post-fix) |
|---|---|
| `/dashboard` | Analyst Panel, Dealer Ops Focus, Today's Focus — Title Case. |
| `/leads` | Leads — single word. |
| `/leads/[id]` | Lead Summary, Activity Timeline, Assignment — Title Case. |
| `/orders` | Pacing Dashboard — Title Case. |
| `/orders/[id]` | Assigned Leads This Month, Recent Routing Events, Order Summary — Title Case. |
| `/areas` | Routing Areas — Title Case. |
| `/forecast` | Scenario Inputs, Order Projection, How This Works — Title Case. |
| `/accounts` | Account List — Title Case. |
| `/accounts/[id]` | Account Summary, Related Contacts, Related Deals, Recent Activities — Title Case. |
| `/contacts` | Contact Directory — Title Case. |
| `/contacts/[id]` | Contact Summary, Related Deals, Activity Timeline — Title Case. |
| `/activities` | Activity Feed — Title Case. |
| `/tasks` | Filters, Task List — Title Case (post-fix). |
| `/cases` | Filters, Case List — Title Case (post-fix). |
| `/campaigns` | Filters, Campaign List — Title Case (post-fix). |
| `/reports`, `/reports/[slug]` | Dynamic from `REPORT_DEFINITIONS` — handled by Grok-owned registry. |

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued` while SUMMARY entries
across prior prompts have treated it as in-flight. Per PLAN.md §2 the
local gate is authoritative; recent commits (`81f438f`, `9b98e72`, and
now `d51d817`) demonstrate Claude-zone S4-F2 work is incremental and
green. No PLAN.md §4 edit attempted from this prompt — the planning
zone is shared and any sprint status promotion belongs in the
SPRINT-ROLLOVER prompt.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`) that gate un-skipping
`e2e/demo-path.spec.ts`. Those live in Grok's zone; no action from
Claude this prompt.

### Next action

If next iteration's prompt continues S4-F2, scan the remaining
non-demo-critical routes — `/reports`, `/reports/[slug]`, `/search`,
`/command-palette`, `/areas/[id]`, `/areas/[id]/edit`, `/areas/new`,
`/orders/[id]/edit`, `/deals/new`, `/accounts/new`, `/contacts/new` —
for similar text-level coherence issues (heading casing, button labels,
empty-state copy). Otherwise S4-F2's demo-critical scope (§4
acceptance) is verified complete and Claude can stand by until
SPRINT-ROLLOVER queues a new claude-owned feature.

### Scope confirmation

No cross-ownership edits: YES (all three edited files live in `app/**`).
CRM-CONTRACT.md honored: YES (no contract edits; no schema, route, or
status value changes — pure text content updates inside CardTitle
children).
