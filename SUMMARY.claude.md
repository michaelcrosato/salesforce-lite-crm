Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — back-to-list nav on form pages + global 404 tab title
Branch: claude/autonomy
Status: active
Commits this prompt: 6963f5f — [claude] S4-F2: add back-to-list nav button on entity creation pages; 501c6be — [claude] S4-F2: set tab title on global not-found page
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:24:30-08:00

### Completed this prompt

- Added a `<Button asChild variant="outline">` "Back to <entity>" link
  to each `/<entity>/new` `PageHeader` children slot. Previously, users
  who reached a `/new` page (via the sidebar or a list-page CTA) had no
  in-page way back to the list — they had to use the sidebar or
  browser back. Now every entity creation page has an explicit escape
  hatch in the page header, matching the "Back to All Reports" pattern
  already in `app/reports/[slug]/page.tsx`.
  - `/accounts/new` → "Back to accounts" → `/accounts`
  - `/deals/new` → "Back to deals" → `/deals`
  - `/tasks/new` → "Back to tasks" → `/tasks`
  - `/cases/new` → "Back to cases" → `/cases`
  - `/campaigns/new` → "Back to campaigns" → `/campaigns`
- Added `export const metadata = { title: "Page not found" }` to
  `app/not-found.tsx`. The root 404 is reached two ways: (a) a detail
  page calls `notFound()` after its `generateMetadata` already ran
  (those cases set their own "Account not found", "Contact not
  found", etc. titles); (b) the user types an unmatched URL like
  `/banana`, in which case no page-level metadata fires and the tab
  would otherwise fall back to the layout default
  `"Salesforce Lite CRM"`. With this addition, case (b) shows
  `"Page not found | Salesforce Lite CRM"` so the browser tab still
  disambiguates 404s from successful pages.
- Each `/new` page also gained two imports (`Link` from `next/link`,
  `Button` from `@/components/ui/button`) where missing. The
  `not-found.tsx` gained one import (`Metadata` from `next`).
- No business logic, schema, route, or contract changes. No new
  dependencies, no test changes, no cross-zone edits.

### Verification

- `npm run build` → SUCCESS (32 routes; no TypeScript regressions).
- `npm run test`  → 162 passed / 162 total (Vitest, 25 files).
- `git status --short` clean before each implementation commit
  aside from the carry-forward `tsconfig.tsbuildinfo` artifact.

### S4-F2 cumulative progress on `claude/autonomy`

Implementation commits on this branch since `cc00d6c` (22 total):

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

Plus pre-session `81f438f`, `9b98e72`, `d51d817` make 25 Claude-zone
S4-F2 commits on this branch.

Ten categories of polish:
1. metadata + product framing alignment
2. copy precision (form/empty/header surfaces)
3. perceived-perf parity (loading skeletons)
4. graceful 404 boundary (now with disambiguating tab title)
5. interactive filter parity
6. internal documentation clarity (forecast formula)
7. complete browser tab title coverage (every reachable URL)
8. server-action error-handling parity (all 7 entity actions)
9. **NEW** explicit back-to-list nav on /new pages
10. plus prior testid/header/case work from earlier prompts.

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued`. Gemini's branch
(`gemini/autonomy`) has a commit `9560bc6` titled
"[gemini] repo-readiness: mark Sprint 4 features done in PLAN.md"
that would promote all Sprint 4 features to `done` once merged. Per
PLAN.md §2 the local gate is authoritative and that gate has been
green for every commit on this branch; the visual QA sweep is
complete for the Claude-owned surface across all coverage
categories listed above.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
that gate un-skipping `e2e/demo-path.spec.ts`. Those live in Grok's
zone; no action from Claude this prompt.

### Next action

S4-F2 is comprehensively complete for the Claude-owned surface
across visual coherence, copy accuracy, perceived performance,
error resilience, and navigation affordances. Best next move: stand
by for SPRINT-ROLLOVER prompt to promote S4-F2 to `done` and queue
the next Claude-owned feature, or for the operator to coordinate a
merge of this branch + Gemini's PLAN.md update.

### Scope confirmation

No cross-ownership edits: YES (all six edited files live in
`app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — every edit is a UI affordance or Next.js
metadata API usage within Claude's zone).
