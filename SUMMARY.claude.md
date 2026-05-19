Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — detail page generateMetadata + form page titles
Branch: claude/autonomy
Status: active
Commits this prompt: 0632bfd — [claude] S4-F2: dynamic generateMetadata titles for detail pages; 63d9ff9 — [claude] S4-F2: add metadata titles for entity creation pages
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:06:00-08:00

### Completed this prompt

- Added `generateMetadata` to all five Claude-owned dynamic detail
  pages. Each function awaits the route param, runs a lightweight
  `findUnique` with `select: { name|firstName/lastName: true }`, and
  returns `{ title: <human label> }`. Missing-record case returns a
  not-found label so the tab still disambiguates.
  - `/accounts/[id]` → `account.name` (fallback "Account not found")
  - `/contacts/[id]` → `${firstName} ${lastName}` (fallback
    "Contact not found")
  - `/leads/[id]` → `${firstName} ${lastName}` (fallback
    "Lead not found")
  - `/orders/[id]` → `order.name` (fallback "Dealer order not found")
  - `/reports/[slug]` → `getReportDefinition(slug).title` (fallback
    "Report not found"; no Prisma read because the registry is
    static).
- Each detail page adds one `import type { Metadata } from "next";`
  to its top import block and one `generateMetadata` export between
  the existing `export const dynamic = "force-dynamic"` and the
  default `export default async function`. No other code is touched;
  the default page render continues to use its own Prisma query with
  full `include`/`select`, so the metadata query is a strict addition
  (a single column lookup with no relations).
- Added static `metadata: Metadata = { title: "..." }` exports to the
  five entity creation pages: `/accounts/new`, `/deals/new`,
  `/tasks/new`, `/cases/new`, `/campaigns/new`. Each title mirrors
  the page's existing `PageHeader` title ("New Account",
  "New Deal", etc.). The pattern matches the Iter 7 list-page
  metadata additions for consistency.
- Combined with the title.template added in Iter 7, every active
  Claude-owned page now renders a disambiguating browser tab title.
  The home redirect at `/` and the seven excluded-route placeholders
  intentionally fall back to the layout default
  ("Salesforce Lite CRM") — they're tab-disambiguation low value
  surfaces (redirect or "unavailable" pages).

### Verification

- `npm run build` → SUCCESS (32 routes; `generateMetadata` compiles
  cleanly for all five detail routes).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files).
- `git status --short` clean before each implementation commit aside
  from the carry-forward `tsconfig.tsbuildinfo` artifact.

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
| `0a33253` | add Apply button to /accounts filter form |
| `bd6468a` | clarify forecast formula with grouping and unicode operators |
| `a93f85a` | broaden /leads/[id] description to cover full page surface |
| `2098a38` | add title template to root metadata |
| `dba0fce` | add per-page metadata titles for distinct browser tabs |
| `0632bfd` | dynamic generateMetadata titles for detail pages |
| `63d9ff9` | add metadata titles for entity creation pages |

Eight categories of polish on this branch:
1. metadata + product framing alignment (e0f138c, 2b7f8da)
2. copy precision on form/empty surfaces (468fb4a, ca0f472, 642ed78, a93f85a)
3. perceived-perf parity for detail routes (07a19cb)
4. graceful 404 boundary (0fba7d3)
5. interactive filter parity across list pages (0a33253)
6. internal documentation clarity (bd6468a)
7. browser tab disambiguation (2098a38, dba0fce, 0632bfd, 63d9ff9)
8. plus the prior `81f438f`, `9b98e72`, `d51d817` testid/header/case
   work from earlier prompts.

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued`; Claude has now
landed eighteen S4-F2 implementation commits across recent
iterations. Per PLAN.md §2 the local gate is authoritative; the
visual QA sweep is materially complete on demo-critical routes and
has now extended into a full per-page browser-tab title system, a
custom 404 boundary, detail-page perceived-perf parity, filter UX
parity, and product framing/copy alignment with README v2.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`) that gate un-skipping
`e2e/demo-path.spec.ts`. Those live in Grok's zone; no action from
Claude this prompt.

### Next action

Pivot from S4-F2 leaf-polish toward S4-F2 closeout work. Candidates:
- Standardize the `/orders/[id]` "no leads delivered" fallback to
  `<EmptyState>` for visual consistency with peer detail pages.
- Sweep `app/error.tsx` and `app/not-found.tsx` for shared layout
  utilities (both use `crm-page flex flex-col items-start gap-4`;
  small extract may be premature).
- Once the next prompt agrees S4-F2 is complete, write a
  consolidation note to `BLOCKERS.gemini.md` documenting the
  remaining components/**-side testid blockers Claude needs from
  Grok before E2E demo-path can be un-skipped.

### Scope confirmation

No cross-ownership edits: YES (all ten edited files live in
`app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — Next.js metadata API additions only; no new
queries beyond a lightweight name-column lookup per detail page).
