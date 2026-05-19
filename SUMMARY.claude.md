Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — custom 404 page
Branch: claude/autonomy
Status: active
Commits this prompt: 0fba7d3 — [claude] S4-F2: add custom 404 page with dashboard and accounts links
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T06:52:30-08:00

### Completed this prompt

- Added `app/not-found.tsx` so the global 404 surface renders inside
  the AppShell + ToastProvider layout instead of falling back to the
  Next.js default unstyled "This page could not be found." page.
- Five Claude-owned detail pages call `notFound()` directly:
  `app/accounts/[id]/page.tsx`, `app/contacts/[id]/page.tsx`,
  `app/leads/[id]/page.tsx`, `app/orders/[id]/page.tsx`, and
  `app/reports/[slug]/page.tsx`. All five now resolve to the new
  custom 404 instead of the bare default, so bad-ID navigations stay
  visually inside the CRM shell with sidebar nav intact.
- The new page mirrors `app/error.tsx`: `crm-page` class, semantic
  `<h1>` + muted description paragraph, then a two-button action row
  ("Return to dashboard", "Browse accounts") using the existing
  `Button asChild` pattern with `Link`. Adds three `data-testid`
  hooks (`page-not-found`, `page-not-found-dashboard`,
  `page-not-found-accounts`) for future Gemini E2E coverage; pattern
  matches `app/error.tsx` test-id conventions.
- No new dependencies. No business logic, schema, route, or contract
  change. No cross-zone edits.

### Verification

- `npm run build` → SUCCESS (32 routes; the existing `_not-found`
  build target now picks up the custom page).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files).
- `git status --short` clean before commit aside from the
  carry-forward `tsconfig.tsbuildinfo` artifact.

### S4-F2 cumulative progress on `claude/autonomy`

Implementation commits on this branch since `cc00d6c`:

| SHA | Subject |
|---|---|
| `e0f138c` | refresh root metadata description to match README framing |
| `468fb4a` | specify report empty-state titles per report |
| `ca0f472` | align /deals/new description with page Deal terminology |
| `2b7f8da` | reframe orders/areas empty-state copy as deferred not demo |
| `07a19cb` | add loading skeletons for account/contact/report detail pages |
| `642ed78` | drop stakeholders term from /contacts description |
| `0fba7d3` | add custom 404 page with dashboard and accounts links |

The branch now adds four categories of visual QA polish on top of the
prior S4-F2 sweep (`81f438f`, `9b98e72`, `d51d817`):
1. metadata + product framing alignment (e0f138c, 2b7f8da)
2. copy precision on form/empty surfaces (468fb4a, ca0f472, 642ed78)
3. perceived-perf parity for detail routes (07a19cb)
4. graceful 404 boundary (0fba7d3)

### Audit observations (no fix this prompt)

- List-page `loading.tsx` files split between two visual styles: the
  `<Skeleton />` component (10 files: accounts, activities, campaigns,
  cases, contacts, dashboard, deals, reports, tasks, root) and inline
  `animate-pulse div` (4 files: areas, forecast, leads, orders). Both
  render the same Tailwind classes under the hood, so this is pure
  refactoring with zero behavior change. Deferred — bikeshed risk.
- Page-header descriptions mix imperative-verb form ("Drag cards
  across stages...", "Search contacts...", "Create postal-code
  leads...") with noun-phrase form ("A live view of...", "Recent
  notes, calls...", "Postal prefix coverage..."). Both are valid copy
  styles. No clear win to unify.
- Per-segment `error.tsx` boundaries do not exist; the root
  `app/error.tsx` handles every server-render failure. Adding
  per-segment boundaries would isolate failures but is debatable for
  a single-tenant CRM foundation. Deferred.

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued` while Claude has
landed eleven S4-F2 implementation commits across recent iterations.
Per PLAN.md §2 the local gate is authoritative; the visual QA sweep
is materially complete on demo-critical routes and is extending into
non-demo-critical copy, perceived-perf, and error-boundary surfaces.
No PLAN.md §4 edit attempted from this prompt — the planning zone is
shared.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`) that gate un-skipping
`e2e/demo-path.spec.ts`. Those live in Grok's zone; no action from
Claude this prompt.

### Next action

Continue the S4-F2 sweep into the remaining list-page action button
copy and link patterns. Specifically: `/deals/page.tsx` "Create a
deal to start the pipeline board." empty state vs the upper-right
"New deal" button on the same page; and the `app/contacts/page.tsx`
inline ContactForm-as-create-pattern that uses a `<details>` /
header tab on other list pages but a plain inline form here. Then
return to merge readiness review against PLAN.md §8 once S4-F2
incremental wins exhaust.

### Scope confirmation

No cross-ownership edits: YES (single new file lives in `app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — new not-found.tsx is a Next.js framework
convention file in the Claude-owned `app/**` zone).
