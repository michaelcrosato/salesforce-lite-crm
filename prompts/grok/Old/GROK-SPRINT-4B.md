# GROK-SPRINT-4B

> Historical artifact. This prompt is superseded by `PLAN.md`,
> `CRM-CONTRACT.md`, `docs/NEXT-PROMPTS.md`, and
> `prompts/shared/s4-f3-grok-component-polish.md`.
> Do not use it as the active next-push prompt.

You are Grok CLI, working in YOLO mode (danger-full-access, never
approval) on an EXISTING Salesforce Lite CRM POC at
C:\dev\salesforce-lite-crm-grok.

Use PowerShell-compatible commands.

This is Sprint 4B — the 36-hour demo-polish window. You are one
of four agents:

- Codex: backend, schema, contract, registry, services, lib (lib/\*\*)
- Claude Code: app routes (app/**/page.tsx, app/**/actions.ts),
  DEMO.md, README.md
- You (Grok CLI): components/**, prisma/seed.ts, lib/business/**,
  Tailwind/CSS
- Gemini CLI: tests/**, e2e/**, scripts/\*\*, Playwright/Vitest
  config, CI workflows, gate

You and Claude work as a coordinated pair on items 54, 55, 56:

- You build the component (`components/**`).
- Claude wires the component into the page (`app/**/page.tsx`).
- Ship the component FIRST. Claude's page work blocks on your
  component being exported.

Seed work (S4-F1) is independent — start it in parallel from the
first hour.

============================================================
OWNED FILES (whitelist)
============================================================

- components/\*\* (all React components, server and client)
- prisma/seed.ts and any seed helpers
- lib/business/\*\* (pure helpers — pipeline totals, weighted
  forecast, activity volume, top accounts, lead source rates)
- tailwind.config.ts (if present)
- app/globals.css (or wherever global CSS lives)
- SUMMARY.grok.md, BLOCKERS.grok.md (you create)
- AGENTS.md (append your section only)

============================================================
NOT-OWNED FILES (do NOT edit)
============================================================

- app/**/page.tsx, app/**/layout.tsx, app/\*\*/actions.ts (Claude) —
  you may IMPORT page-level types if Claude exports them, but you
  do not author pages.
- prisma/schema.prisma, prisma/migrations/\*\* (Codex)
- lib/crm/**, lib/services/**, lib/validation.ts,
  lib/featureFlags.ts, lib/postal.ts (Codex) — you IMPORT these
  but never edit.
- tests/**, e2e/**, scripts/**, .github/workflows/** (Gemini)
- CRM-CONTRACT.md (Codex) — read-only SSOT
- README.md, DEMO.md (Claude)

If you need a service function that doesn't exist on
`lib/crm/crmClient.ts`, file a blocker on Codex. Do NOT add it
yourself.

============================================================
EXECUTION DISCIPLINE — STRICT
============================================================

Failure-loop rule, non-negotiable:

- After any failed command: smallest fix, rerun ONCE.
- Still red: one more focused fix, rerun ONCE.
- Still red after two attempts: revert (or feature-flag), append a
  clear entry to BLOCKERS.grok.md (exact command, exact error,
  files touched, recommended next fix), move to next feature. No
  third loop.

After each feature:

- Run gate via Gemini's script: `pwsh scripts/local-gate.ps1`.
  Fallback if Gemini hasn't shipped it:
  `npm run test && npm run build && npm run test:e2e`.
- If Playwright browsers missing: `npx playwright install chromium`.
- If gate green, conventional commit.
- One-line shipped/blocked note to SUMMARY.grok.md.

TypeScript discipline:

- No `any`, no `@ts-ignore`, no `@ts-expect-error`, no
  `as unknown as` bypasses.
- After every commit:
  `rg '\bany\b|@ts-ignore|@ts-expect-error' components lib/business`
  — must return no matches in YOUR files.

Component discipline:

- Server components by default. `"use client"` ONLY when the
  component needs onChange / onClick / useState / useEffect /
  drawer state. Mark the boundary at the smallest possible scope.
- Every interactive element accepts a `data-testid` prop and
  forwards it to the underlying DOM element. Naming follows
  Claude's convention: `<entity>-<element>-<purpose>` kebab-case.
- Use existing design tokens / Tailwind classes from the repo. Do
  NOT introduce a new design system. If a needed token is missing,
  extend `tailwind.config.ts` or `globals.css` in the same commit
  as the component, and document in SUMMARY.grok.md.
- Empty/loading/error states are first-class — every list / detail
  component gets all three.

Seed discipline:

- Seed changes are HIGH-RISK because Gemini's anchor tests assert
  against them. Before any seed change, document the anchor values
  in SUMMARY.grok.md so Gemini can sync. Communicate via BLOCKERS
  if the change is breaking.

============================================================
PRE-FLIGHT — Rollback safety and branch (no commit)
============================================================

1. `git status --short` — must return nothing.
2. `git log --oneline -5` — record current HEAD.
3. Confirm Sprint 4B start tag exists:
   `git rev-parse -q --verify refs/tags/sprint-4b-start *> $null`
   `if ($LASTEXITCODE -ne 0) { Write-Host 'WARN: sprint-4b-start tag not found' }`
4. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-grok-start.zip HEAD`
5. Switch to working branch:
   `$branch = git branch --list feat/grok-components-and-seed-tuning`
   `if ($branch) { git switch feat/grok-components-and-seed-tuning } else { git switch -c feat/grok-components-and-seed-tuning }`

Do NOT commit anything in pre-flight.

============================================================
SLICE 0 — Repo discovery and component inventory (single commit)
============================================================

1. Read PLAN.md §4 + §5. Confirm your ownership zones.
2. Read CRM-CONTRACT.md. Note the routing decision return type
   (you'll render it in Item 55), the postal helper signature
   (you'll consume in Item 56), and the feature flag set (you'll
   render the excluded route placeholder for Item 54).
3. Inventory `components/`. List existing components, their
   client/server boundary, and which pages import them.
4. Inventory `lib/business/`. List existing helpers. Note the two
   you need to extend for Item 34 (leads-by-source, top-accounts —
   though Codex may have moved these to `lib/services/reports.ts`;
   READ the contract to confirm where they live now).
5. Inspect `prisma/seed.ts`. Document current anchor values:
   - Demo postal code
   - Behind-pace order(s) — orderId, dealerName, expected vs actual pace
   - Dashboard KPI values (pipeline total, weighted forecast,
     activity volume)
   - Analyst-panel actionable items (which entity, which condition)
   - Forecast baseline value
6. Run baseline gate. Must be green.
7. Create SUMMARY.grok.md with: agent identity, owned zones, Slice
   0 baseline, seed anchor values, feature queue, unblock status.
8. Commit: `chore(grok): slice 0 component inventory and seed anchors`

============================================================
SLICE 1 — Components and seed bootstrap, FAST-MERGE
============================================================

Two parallel tracks. Both go into ONE Slice 1 commit so Claude can
start his page wiring without waiting on multiple commits from you.

---

## Track A — Components for items 54, 55, 56

Depends on Codex `[UNBLOCK]` (lib/featureFlags.ts, lib/postal.ts,
routing decision return type) for the type signatures only. If
unblock isn't ready, you can scaffold with placeholder type imports
that you replace after.

1a. `components/excluded-route-placeholder.tsx` (Item 54) - Server component - Props: `{ route: string; reason?: string }` - Renders centered card: icon (lucide-react or equivalent —
use what the repo already imports), "This module is not part
of the demo", route name, reason if provided, link to
CRM-CONTRACT.md anchor. - `data-testid="excluded-route-placeholder"` on root element.

1b. `components/routing-decision-detail.tsx` (Item 55) - Client component (collapsed/expanded toggle is interactive) - Props: `{ decision: RoutingDecision | null; testid?: string }`
where `RoutingDecision` is imported from
`lib/services/leads` (or wherever Codex exported it; check
the contract). - Collapsed state: one-line summary: "Routed to <area> →
<order> (rank 1, +<paceGap>d behind)". Toggle button:
`data-testid="routing-detail-toggle"`. - Expanded state: step-by-step breakdown rendered from the
`decision.steps` array. Each step is a labeled row:
_ Normalize: `<raw> → <normalized>`
_ Extract prefix: `<prefix>`
_ Match area: `<areaName>` (or "no match")
_ Filter orders: "<count> candidate orders"
_ Rank by pace gap: ordered list with paceGap values
_ Select: highlighted selected order - Empty state (decision === null): "No routing record found for
this lead." with `data-testid="routing-detail-empty"`. - Loading state: skeleton rows (use Tailwind animate-pulse).

1c. `components/postal-code-input.tsx` (Item 56) - Client component - Props: `{ value: string; onChange: (v: string) => void;
      country: 'CA' | 'US'; error?: string; testid?: string;
      required?: boolean }` - Imports `normalizePostalCode` from `lib/postal.ts` (Codex's). - On blur: calls normalize, if valid replaces displayed value
with normalized form, if invalid keeps raw and lets the
`error` prop drive display (parent decides whether to render
the message — usually after submit). - Inline error display when `error` prop set: red border,
message below, `data-testid="postal-input-error"`. - Forward `testid` to the `<input>` element.

1d. `components/page-skeleton.tsx` (supports Item 37 FOLD-S4 and
Claude's loading.tsx audit) - Server component - Props: `{ variant?: 'list' | 'detail' | 'dashboard' }` - Renders skeleton rows / cards matching each variant's
typical layout. Tailwind animate-pulse, neutral background.

---

## Track B — Seed anchor stabilization (S4-F1)

1e. Update `prisma/seed.ts` to PIN the demo anchor values you
documented in Slice 0. Specifically: - Demo postal code MUST always resolve to a known area in seed. - At least one DealerOrder MUST have a pace gap that puts it in
the analyst panel's "actionable" set. - Forecast inputs MUST yield a stable baseline (within ±5%
run-over-run — meaning no randomness in stage probabilities
or deal values; if there's a `faker.seed` call, confirm it's
set with a fixed seed value). - Lead-source distribution MUST cover at least 3 sources so
`leadsBySource` returns a non-trivial array. - Top-accounts MUST have at least one account with multiple
open deals so `topAccountsByDealValue` returns a meaningful
ranking.
Do NOT change schema. Only adjust seed VALUES.

    Run `npm run seed` and `npx prisma studio` (or your inspection
    tool) to verify each anchor renders as expected.

1f. Append a "Seed anchor manifest" section to SUMMARY.grok.md
listing every anchor value with the exact field path
(`Lead[0].postalCode`, `DealerOrder[3].expectedPace`, etc.).
This is Gemini's contract for Item 53 anchor tests.

---

## Commit

Run full gate. If green, commit:
`feat(grok): slice 1 components and seed anchor stabilization [UNBLOCK]`

The `[UNBLOCK]` tag tells Claude your components are exported and
he can import them. If only one track is ready (e.g. components
ready but seed anchors need more work), split into two commits —
ship components first with `[UNBLOCK]`, then ship seed separately.

============================================================
SLICE 2 — Grok feature queue (sequential, commit per feature)
============================================================

---

## Feature 2.1 — Component polish audit (S4-F3, Item 6 FOLD-S4)

Walk every component under `components/`. For each list / detail /
form component, confirm three states exist:

a) Empty: explicit "no <entity>" message with optional CTA.
b) Loading: skeleton variant (use your new PageSkeleton component
or a local skeleton).
c) Error: error boundary message with retry where possible.

Missing states → add them. Use existing toast/confirm components
(confirmed in e2e per backlog item 6).

Commit: `feat(grok): component empty/loading/error state pass`

---

## Feature 2.2 — (Item 34) Report helpers expansion

Per CRM-CONTRACT.md, Codex's `lib/services/reports.ts` exports
`leadsBySource` and `topAccountsByDealValue` (he added these in
his Sprint 4B Feature 2.4).

Your job: the consumer-side helpers in `lib/business/` that
take the raw service output and shape it for chart components.

a) `lib/business/leadsBySourceChart.ts`: takes the service output,
returns `{ labels: string[]; data: number[]; rates: number[] }`
suitable for a bar/dual-axis chart.
b) `lib/business/topAccountsCard.ts`: takes the service output,
returns ranked rows with formatted currency strings, "+N more"
collapse logic if > 10.

Add Vitest tests for both helpers (these are pure functions; tests
are unit-level — your zone since they cover `lib/business/`).
Actually wait — Gemini owns tests/\*\*. File a blocker on Gemini
listing the helpers and their expected inputs/outputs. Ship the
helpers themselves with no test file; Gemini's gap-audit feature
(2.3 in their queue) will pick them up.

Commit: `feat(grok): chart-ready report helpers`

---

## Feature 2.3 — (Item 47 CANDIDATE-S5 partial) Reports index page support

NOT shipping the reports page itself (Claude's zone). But:

a) `components/reports/PipelineByStageCard.tsx` — consumes
pipeline-by-stage data, renders a card with stage rows and
weighted totals.
b) `components/reports/LeadsBySourceCard.tsx` — consumes Feature
2.2's leadsBySource shape, renders bar chart (use the repo's
existing chart library; if none present, render as a styled
table with horizontal bar fills — do NOT add a new dependency).
c) `components/reports/TopAccountsCard.tsx` — consumes Feature
2.2's topAccounts shape.
d) `components/reports/ActivityVolumeCard.tsx` — consumes activity
volume data (existing helper).

Each card is a server component, takes its data as props (Claude's
page fetches and passes), renders empty state if data is empty.

If Claude doesn't end up shipping the reports index page this
sprint (it's CANDIDATE-S5), these cards still sit ready for Sprint 5. No wasted work — they're isolated and tested.

Commit: `feat(grok): report cards for future reports index`

---

## Feature 2.4 — (Item 32 CANDIDATE-S5 — conditional)

CSV export helper. Only ship this if your queue items 2.1–2.3
finish before 24h into the sprint window. Per the priority order
in the backlog framing, CSV is CANDIDATE-S5 and gets promoted only
if P0/P1 complete early.

If shipping:
a) `lib/business/csvExport.ts` — pure helper. Functions:

- `toCsv<T>(rows: T[], columns: Array<{ key: keyof T; label: string }>): string`
- `downloadCsv(filename: string, csv: string): void` (browser-side)
  b) `components/CsvExportButton.tsx` — client component, accepts
  rows + columns + filename, renders button, calls helpers on
  click. `data-testid="csv-export-{entity}"`.
  c) File a blocker on Claude asking him to wire the button on the
  leads, deals, and accounts pages — but only if you have time.
  Otherwise leave it as components-only and Sprint 5 picks up.

Commit: `feat(grok): csv export helper and button (CANDIDATE-S5 advance)`

---

## Feature 2.5 — Final audit and handoff

a) `rg '\bany\b|@ts-ignore|@ts-expect-error' components lib/business`
— must return no matches.
b) `rg 'console\.log' components lib/business`
— must return no matches (no stray debug logs).
c) Walk `components/`: every interactive component has
`data-testid` forwarded. List in SUMMARY.grok.md alongside
Claude's catalog.
d) Walk `lib/business/`: every exported function has JSDoc.
e) Re-run `npm run seed` and verify all seed anchors still match
the manifest in SUMMARY.grok.md. If drift, fix or document.
f) `pwsh scripts/local-gate.ps1` — must be `[GATE PASS]`.
g) Update SUMMARY.grok.md final section: shipped, deferred,
blockers consumed/produced, gate status, seed anchor manifest.
h) Update AGENTS.md "Grok CLI" section.

Commit: `docs(grok): sprint 4b final audit and seed manifest`

============================================================
FINAL VERIFICATION — read-only
============================================================

1. `pwsh scripts/local-gate.ps1`
2. `rg '\bany\b|@ts-ignore|@ts-expect-error' components lib/business`
3. `rg 'console\.log' components lib/business`
4. `git status --short`
5. `git log --oneline -15`
6. `git archive --format=zip --output ..\salesforce-lite-crm-sprint-4b-grok.zip HEAD`

Final report:

- Sections completed / skipped
- Commit hashes
- New components: ExcludedRoutePlaceholder, RoutingDecisionDetail,
  PostalCodeInput, PageSkeleton, 4 report cards, (CsvExportButton if
  shipped)
- Seed anchor manifest: stable / drifted
- New helpers: leadsBySourceChart, topAccountsCard, (csvExport if
  shipped)
- Type-safety scan: clean / dirty
- Debug-log scan: clean / dirty
- Blockers: produced (for whom) / consumed (whose)

============================================================
STOPPING CONDITIONS
============================================================

Stop if:

- Slice 0 baseline gate red
- 3 consecutive failure-loop limits
- Codex `[UNBLOCK]` doesn't appear within first 6 hours AND seed
  work is also done — fall back to Feature 2.1 (component polish)
  which only needs existing components, then stop and document.
- Seed anchor changes break Gemini's anchor tests > 2 times
  (signal that anchor manifest needs renegotiation before
  proceeding)
- Working tree unrecoverable
- Out of features

Final SUMMARY.grok.md + BLOCKERS.grok.md, then
`STOPPED: <reason>` as last line.

============================================================
GO
============================================================

Begin Pre-flight now. Slice 0 → Slice 1.

Track B (seed anchor stabilization) is INDEPENDENT of Codex's
unblock — start it immediately in parallel with Slice 0.
Track A (components) needs the Codex `[UNBLOCK]` for the type
imports of `RoutingDecision` (Item 55) and `lib/postal.ts`
signature (Item 56). For Item 54's placeholder, you can ship
without unblock — it doesn't import from Codex's new modules.

Priority within Slice 2: 2.1 (polish) ships fastest because no
dependencies. 2.2 + 2.3 wait on Codex's reports service. 2.4 (CSV)
only if everything else is green by 24h.

Do not pause between features once unblocks land.
