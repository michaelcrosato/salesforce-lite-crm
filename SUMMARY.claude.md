Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — forecast empty state for no active orders
Branch: claude/autonomy
Status: active
Commits this prompt: af2ec63 — [claude] S4-F2: add EmptyState to forecast Order Projection when no active orders
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:27:00-08:00

### Completed this prompt

- `/forecast/page.tsx` Order Projection card previously always
  rendered the `<table>` (column headers + tbody) regardless of
  whether any active orders existed. When the seed produced zero
  active orders (e.g. a fresh setup before seed runs, or an edge
  state with all orders paused), the table rendered headers only
  with an empty tbody — confusing UX that gave no signal about what
  was missing or how to recover.
- Wrapped the table render in `forecast.rows.length > 0` and added
  an `<EmptyState>` fallback that titles "No active dealer orders",
  describes the relationship to the orders surface, and ships an
  action button linking to `/orders` so the user has an explicit
  next step. Matches the established list-page empty-state pattern
  used on `/accounts`, `/contacts`, `/orders`, `/areas`, and
  `/activities`.
- Imported `EmptyState` from `@/components/ui/empty-state`. No other
  imports changed. No business logic change — `buildForecast` still
  runs and its summary KPI cards still render with whatever
  projected values fall out (typically zeros) so the page is
  consistent across the empty / non-empty rows transition.

### Verification

- `npm run build` → SUCCESS (32 routes; new EmptyState branch
  compiles cleanly).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files). No
  test exercises the empty-rows branch in /forecast specifically;
  this change is defensive against an edge state.
- `git status --short` clean before the implementation commit aside
  from the carry-forward `tsconfig.tsbuildinfo` artifact.

### S4-F2 cumulative progress on `claude/autonomy`

Implementation commits on this branch since `cc00d6c` (23 total):

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
| `c175bbe` | add metadata titles for excluded route placeholders |
| `45a5398` | broaden dashboard description |
| `aed2ea2` | Prisma error handling on account actions |
| `b382f36` | Prisma error handling on deal actions |
| `8be5bd7` | Prisma error handling on lead actions |
| `6963f5f` | back-to-list nav button on entity creation pages |
| `501c6be` | set tab title on global not-found page |
| `af2ec63` | EmptyState on forecast when no active orders |

Plus pre-session `81f438f`, `9b98e72`, `d51d817` make 26 Claude-zone
S4-F2 implementation commits on this branch.

Ten categories of polish:
1. metadata + product framing alignment
2. copy precision (form/empty/header surfaces)
3. perceived-perf parity (loading skeletons)
4. graceful 404 boundary
5. interactive filter parity
6. internal documentation clarity (forecast formula)
7. complete browser tab title coverage
8. server-action error-handling parity (all 7 entity actions)
9. explicit back-to-list nav on /new pages
10. **NEW** defensive empty-state coverage on /forecast Order Projection

### Audit observations (no fix this prompt)

- Detail-page sub-list empty states (`/accounts/[id]` Related
  Contacts/Deals; `/contacts/[id]` Related Deals; `/orders/[id]`
  Assigned Leads This Month) all use a plain `<p
  className="text-sm text-muted-foreground">` for the "no items"
  fallback rather than `<EmptyState>`. This is intentionally
  consistent across all detail pages — the EmptyState component is
  reserved for top-level list pages where the empty state IS the
  whole page. Not changing.
- `prismaErrorMessage` is now duplicated in four entity action files
  (contacts, accounts, deals, leads — tasks/cases/campaigns have
  their own variants). Extracting to a shared helper would require
  either `app/_lib/` (acceptable in Claude's zone) or `lib/` (Codex's
  zone). The four-line duplication is mild; defer unless future
  changes need a single source.

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued`. Gemini's branch
(`gemini/autonomy`) has commit `9560bc6` that would promote Sprint 4
features to `done` once merged. Per PLAN.md §2 the local gate is
authoritative; gate has been green for every commit on this branch.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
that gate un-skipping `e2e/demo-path.spec.ts`. Those live in Grok's
zone; no action from Claude this prompt.

### Next action

S4-F2 is comprehensively complete for the Claude-owned surface
across visual coherence, copy accuracy, perceived performance,
error resilience, navigation affordances, and defensive empty-state
coverage. Best next move: stand by for SPRINT-ROLLOVER prompt, or
the operator may merge this branch + Gemini's PLAN.md update.

### Scope confirmation

No cross-ownership edits: YES (single edited file lives in
`app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — defensive empty-state wraps the existing render
with no behavior change for the populated case).
