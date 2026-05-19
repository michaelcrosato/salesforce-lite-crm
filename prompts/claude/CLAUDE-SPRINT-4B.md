#CLAUDE-SPRINT-4B

You are Claude Code, working in YOLO mode (danger-full-access,
never approval) on an EXISTING Salesforce Lite CRM POC at
C:\dev\salesforce-lite-crm.

Use PowerShell-compatible commands.

This is Sprint 4B — the 36-hour demo-polish window. You are one
of four agents:

- Codex: backend, schema, contract, registry, services, lib (lib/\*\*)
- You (Claude Code): app routes (app/**/page.tsx, app/**/actions.ts,
  app/**/loading.tsx, app/**/error.tsx, app/layout.tsx), DEMO.md,
  README.md
- Grok CLI: components/**, prisma/seed.ts, lib/business/**,
  Tailwind/CSS
- Gemini CLI: tests/**, e2e/**, scripts/\*\*, Playwright/Vitest
  config, CI workflows, gate

You wait for Codex's `[UNBLOCK]` commit on
`feat/codex-services-routing-and-validation` before starting items
54, 55, 56. You can ship DEMO.md (item 52) in parallel from the
start — it has no code dependencies.

You and Grok work as a coordinated pair on items 54, 55, 56:

- Grok builds the component (`components/**`).
- You wire the component into the page (`app/**/page.tsx`).
- Grok's component MUST be present and exported before you import
  it. If it isn't yet, ship your other queue items first and circle
  back.

============================================================
OWNED FILES (whitelist)
============================================================

- app/**/page.tsx, app/**/layout.tsx, app/**/loading.tsx,
  app/**/error.tsx, app/**/route.ts (if any), app/**/not-found.tsx
- app/\*\*/actions.ts (server actions used by pages)
- DEMO.md (you create at repo root)
- README.md (you edit — limitations section, CI badge)
- SUMMARY.claude.md, BLOCKERS.claude.md (you create)
- AGENTS.md (append your section only; do not rewrite other agents')

============================================================
NOT-OWNED FILES (do NOT edit)
============================================================

- components/\*\* (Grok) — you IMPORT from these; you do not author
  them. If a component you need does not exist, file a blocker on
  Grok and ship something else from your queue.
- lib/\*\* (Codex)
- prisma/\*\* (Codex / Grok)
- tests/**, e2e/**, scripts/**, .github/workflows/** (Gemini)
- CRM-CONTRACT.md (Codex) — read-only SSOT

If you need a new server action that calls a service that doesn't
yet exist on `crmClient`, file a blocker on Codex and skip the
dependent feature. Do NOT edit `lib/` to make your page work.

============================================================
EXECUTION DISCIPLINE — STRICT
============================================================

Failure-loop rule, non-negotiable:

- After any failed command: smallest fix, rerun ONCE.
- Still red: one more focused fix, rerun ONCE.
- Still red after two attempts: revert (or hide behind a feature
  flag), append a clear entry to BLOCKERS.claude.md (exact command,
  exact error, files touched, recommended next fix), move to next
  feature. No third loop.

After each feature:

- Run gate via Gemini's script: `pwsh scripts/local-gate.ps1`.
  If Gemini hasn't shipped it yet, fall back to
  `npm run test && npm run build && npm run test:e2e`.
- If Playwright browsers missing: `npx playwright install chromium`.
- If gate green, conventional commit.
- One-line shipped/blocked note to SUMMARY.claude.md.

TypeScript discipline:

- No `any`, no `@ts-ignore`, no `@ts-expect-error`, no
  `as unknown as` bypasses.
- After every commit:
  `rg '\bany\b|@ts-ignore|@ts-expect-error' app`
  — must return no matches in YOUR files.

Server component discipline:

- App Router pages default to server components. Use `"use client"`
  ONLY when interactivity requires it (forms with onChange,
  drawers, tabs). Grok's components mark their own boundaries; you
  do not change them.
- Server actions are `"use server"` in `app/**/actions.ts` files;
  do not inline server actions inside page files.
- `export const dynamic = "force-dynamic"` per existing convention
  on pages that read live data.

data-testid discipline:

- Every interactive element Gemini needs to target in e2e MUST get
  a `data-testid` attribute. Naming: `<entity>-<element>-<purpose>`,
  kebab-case (e.g. `lead-form-postal-input`,
  `routing-detail-toggle`, `excluded-route-placeholder`).
- When a Grok component bubbles a testid up via prop, pass it down
  from the page; do not invent inline.

============================================================
PRE-FLIGHT — Rollback safety and branch (no commit)
============================================================

1. `git status --short` — must return nothing.
2. `git log --oneline -5` — record current HEAD.
3. Ensure Sprint 4B start tag exists (Codex/Gemini create it; you
   verify):
   `git rev-parse -q --verify refs/tags/sprint-4b-start *> $null`
   `if ($LASTEXITCODE -ne 0) { Write-Host 'WARN: sprint-4b-start tag not found; check with Codex' }`
4. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-claude-start.zip HEAD`
5. Switch to working branch:
   `$branch = git branch --list feat/claude-demo-and-route-polish`
   `if ($branch) { git switch feat/claude-demo-and-route-polish } else { git switch -c feat/claude-demo-and-route-polish }`

Do NOT commit anything in pre-flight.

============================================================
SLICE 0 — Repo discovery and dependency check (single commit)
============================================================

1. Read PLAN.md §4 (non-goals) and §5 (ownership). Confirm the
   ownership list still names you for `app/**/page.tsx`.
2. Read CRM-CONTRACT.md (your read-only SSOT). Note:
   - Excluded routes list (you'll hide links to them in Item 54)
   - Drawer-canonical pattern for deals (`/deals?deal=<id>`)
   - Routing decision return type (you'll display in Item 55)
   - Postal helper signature (you'll wire in Item 56)
3. Check whether Codex's `[UNBLOCK]` commit on
   `feat/codex-services-routing-and-validation` has merged to
   `main` (or is otherwise visible to your branch). If not, you
   can still do Slice 1 (DEMO.md) — that's pure docs. Items 54,
   55, 56 wait for the unblock.
4. Inspect `app/`. Map every page route currently in the app.
   Cross-reference against CRM-CONTRACT.md's ROUTE_REGISTRY and
   EXCLUDED_ROUTES. Record:
   - Live routes
   - Routes mentioned in nav/links but pointing nowhere
   - Routes in EXCLUDED_ROUTES that currently 404 vs. render
     something broken
5. Run baseline gate. Must be green.
6. Create SUMMARY.claude.md with: agent identity, owned zones,
   Slice 0 baseline, feature queue (paste from Slice 2 below),
   unblock status (Codex committed yes/no, Grok committed yes/no
   for the components you need).
7. Commit: `chore(claude): slice 0 route inventory and unblock check`

============================================================
SLICE 1 — DEMO.md (single commit, NO unblock dependency)
============================================================

This is the only Slice 1 item that's independent of Codex/Grok.
Ship it immediately so you have at least one commit on the board
while waiting for the unblock.

(Item 52) Create `DEMO.md` at repo root. Structure:

```
# Five-Minute Demo Walkthrough — Salesforce Lite CRM

## Before you start
- Reset state: `npm run seed`
- Verify gate green: `pwsh scripts/local-gate.ps1 --skip-e2e`
- Open at http://localhost:3000

## Step 0:30 — Dashboard (open at /)
- Show pipeline total, weighted forecast, activity volume
- Expected: <name the specific numbers from seed>

## Step 1:00 — Drop a lead
- Navigate to /leads, click "New lead"
- Enter the demo postal code <V5A 1S6 or whatever seed uses>
- Submit
- Expected: lead lands, routing decision visible inline
  (Item 55 detail panel)

## Step 1:30 — Inspect the routing decision
- Click the "Why this routing?" toggle on the new lead row
- Expected: postal → area → candidate orders → pace-gap rank → selected order

## Step 2:30 — Deal board
- Navigate to /deals
- Drag one card from "Negotiation" to "Closed Won"
- Expected: card moves, stage history records (Item 17)

## Step 3:30 — Analyst panel
- Navigate to /analyst
- Expected: at least one stale opportunity flagged, one overdue task

## Step 4:30 — Forecast
- Navigate back to /
- Expected: weighted forecast value updated to reflect the just-moved deal

## Known limitations (for reviewer expectation-setting)
- No auth / multitenancy (PLAN.md §4)
- No deployment pipeline (PLAN.md §4)
- Tasks / Cases / Campaigns: backend present, UI excluded from demo
- No full deal detail page; deal detail uses drawer at /deals?deal=<id>
- No global search UI / command palette
- Lead → Account+Contact+Opportunity conversion: not in this vertical
  (dealer routing replaces it)
- CSV import/export: candidate for Sprint 5
- External AI integration: out of scope (Gemini CLI is execution
  agent, not API integration)

## Reset for next demo
- `npm run seed`
```

Time each step. Include the exact expected number/name where you
can read it from seed. If you can't because seed values are
unknowable until Grok finalizes Item S4-F1, leave `<TBD from
SEED-ANCHORS>` placeholders and file a blocker on Grok asking
for the final anchor values.

Commit: `docs(claude): five-minute demo walkthrough`

============================================================
SLICE 2 — Claude feature queue (sequential after [UNBLOCK])
============================================================

Wait for Codex `[UNBLOCK]` before starting Feature 2.1.

---

## Feature 2.1 — (Item 54) Broken-link guard (page-level)

Depends on Codex shipping `lib/featureFlags.ts` and `EXCLUDED_ROUTES`.

a) In `app/layout.tsx` (or wherever the nav lives — if it's in
`components/nav/Sidebar.tsx`, that's Grok's; file a blocker
asking Grok to consume `EXCLUDED_ROUTES` and hide entries), if
you own the nav file, import `EXCLUDED_ROUTES` and filter the
nav entries.
b) For each excluded route that currently has a page file (e.g.
`app/tasks/page.tsx` if any exists):

- Either delete the page file (preferred if it was a stub), OR
- Replace contents with a `app/<route>/not-found.tsx`-style
  page that renders Grok's `<ExcludedRoutePlaceholder />`
  component (file blocker if Grok hasn't built it yet) with
  `data-testid="excluded-route-placeholder"` and a one-liner:
  "This module is not part of the demo. See CRM-CONTRACT.md."
  c) Add a `notFound()` call in any page that conditionally routes
  to an excluded path.
  d) Verify by visiting each EXCLUDED_ROUTE in dev:
  `npm run dev` → curl each path → confirm 404 or placeholder.

Coordinate with Grok via SUMMARY/BLOCKERS — the placeholder
component is Grok's; the page-level wiring is yours.

Commit: `feat(claude): broken-link page-level guards`

---

## Feature 2.2 — (Item 55) Routing detail inline display

Depends on Codex shipping `getRoutingDecisionForLead` AND Grok
shipping a `<RoutingDecisionDetail />` component.

a) On `app/leads/page.tsx`: for each lead row, fetch the routing
decision via `crmClient.leads.getRoutingDecision(lead.id)` (in
a server component, await it; lazy-load if performance is a
concern — use Suspense). Pass the decision to Grok's
`<RoutingDecisionDetail />` component with
`data-testid="routing-detail-{leadId}"`.
b) On the order detail surface — per CRM-CONTRACT, this is
`/orders/[id]` if it exists as a page, or a drawer/inline on
`/orders`. Mirror the same component there for the order's
originating lead.
c) The component is hidden by default (collapsed); the page wires
an expand control. data-testid for the toggle:
`routing-detail-toggle-{leadId}`.

If Grok's component isn't ready, ship the data-fetching wiring
behind a feature flag (`FEATURE_FLAGS.routingDetailUi`) set to
false. File a blocker on Grok to deliver the component.

Commit: `feat(claude): routing decision detail wiring on leads and orders`

---

## Feature 2.3 — (Item 56) Postal-code validation in lead form

Depends on Codex shipping `lib/postal.ts` AND `postalCodeSchema`
extended into the lead-creation Zod schema in `lib/validation.ts`.

a) In `app/leads/actions.ts` (server action for lead creation):
import the extended lead schema, validate on submit, return
structured error `{ field: "postal", message: "<reason>" }`
when invalid. Do NOT swallow the reason — Grok's input
component will display it inline.
b) In `app/leads/page.tsx` or wherever the form mounts: render
Grok's `<PostalCodeInput />` (file blocker if not built yet)
with `data-testid="lead-form-postal-input"` and pass the
server action's error state down.
c) On valid submit, the action calls `crmClient.leads.create` as
before. No behavior change beyond the validation gate.

Commit: `feat(claude): postal validation wired into lead form`

---

## Feature 2.4 — README limitations + CI badge update

a) Update README.md "Known limitations" section to match the
exclusions list in DEMO.md (single source of truth wording).
b) Add the CI badge that Gemini requested:
`[![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/ci.yml)`
at the top of README. Read the actual repo URL from
`package.json` `repository` field or git remote; do not
hardcode if those are different.
c) Add a "Demo" callout near the top linking to `DEMO.md` and
noting "Run `npm run seed` for one-click reset."

Commit: `docs(claude): readme limitations and ci badge`

---

## Feature 2.5 — Stale page audit and final polish

Walk every page under `app/`. For each:

a) Has `loading.tsx`? If not, add a minimal one importing Grok's
`<PageSkeleton />` (file blocker if missing).
b) Has `error.tsx`? If not, add one with a "Something went wrong"
message and a "Reset" button.
c) Has `export const dynamic = "force-dynamic"` where needed (any
page that reads live data)?
d) `data-testid` on the page-level wrapper, named
`page-<route-slug>`.

Don't add empty states yourself — those are component-level
(Grok). File blockers for missing component-level states.

Commit: `feat(claude): page-level loading/error/dynamic polish`

---

## Feature 2.6 — Final audit and handoff

a) `rg '\bany\b|@ts-ignore|@ts-expect-error' app`
— must return no matches.
b) `rg '/deals/\[id\]|/deals/\$\{id\}|/deals/:id' app`
— only matches in comments explicitly stating route is excluded.
c) `rg 'href="/tasks"|href="/cases"|href="/campaigns"' app`
— must return no matches (broken-link guard verification).
d) `pwsh scripts/local-gate.ps1` — must be `[GATE PASS]`.
e) Update SUMMARY.claude.md final section: shipped, deferred,
blockers consumed/produced, gate status, test-id catalog
(list every new data-testid you added — Gemini uses this).
f) Update AGENTS.md "Claude Code" section if changes warrant.

Commit: `docs(claude): sprint 4b final audit and testid catalog`

============================================================
FINAL VERIFICATION — read-only
============================================================

1. `pwsh scripts/local-gate.ps1`
2. `rg '\bany\b|@ts-ignore|@ts-expect-error' app`
3. `rg '/deals/\[id\]|/deals/\$\{id\}|/deals/:id' app components`
4. `git status --short`
5. `git log --oneline -15`
6. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-claude.zip HEAD`

Final report:

- Sections completed / skipped
- Commit hashes
- DEMO.md status: shipped / blocked on seed anchors
- Item 54 (broken-link guard): shipped / partial
- Item 55 (routing detail): shipped / blocked on Grok component
- Item 56 (postal validation): shipped / blocked on Codex helper
- README updates: shipped
- New data-testids added (full list)
- Type-safety scan: clean / dirty
- Route scan: clean / dirty
- Blockers: produced (for whom) / consumed (whose)

============================================================
STOPPING CONDITIONS
============================================================

Stop if:

- Slice 0 baseline gate red
- 3 consecutive failure-loop limits
- Codex `[UNBLOCK]` doesn't appear within first 6 hours of the
  36-hour window AND you've completed DEMO.md — at that point,
  file a blocker on Codex and stop on Sprint 4B items, fall back
  to README polish and stale-page audit if those don't depend on
  Codex's lib helpers.
- Working tree unrecoverable
- Out of features

Final SUMMARY.claude.md + BLOCKERS.claude.md, then
`STOPPED: <reason>` as last line.

============================================================
GO
============================================================

Begin Pre-flight now. Slice 0 → Slice 1 (DEMO.md, INDEPENDENT — do
this regardless of unblock status). Then wait for Codex `[UNBLOCK]`
to start Slice 2 Feature 2.1 onward.

While waiting on the unblock, Feature 2.4 (README + CI badge) is
also semi-independent — you can draft it once Gemini's CI workflow
has a recognizable URL pattern. Feature 2.5 (page polish) needs
some of Grok's components but the loading/error/dynamic additions
are yours alone — can also proceed in parallel.

Do not pause between features once the unblock lands.
