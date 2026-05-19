Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — per-page browser tab titles
Branch: claude/autonomy
Status: active
Commits this prompt: 2098a38 — [claude] S4-F2: add title template to root metadata for per-page tab titles; dba0fce — [claude] S4-F2: add per-page metadata titles for distinct browser tabs
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T07:02:30-08:00

### Completed this prompt

- Root `app/layout.tsx` `Metadata.title` switched from a flat string
  to a `{ default, template }` object: `default` keeps the existing
  "Salesforce Lite CRM" branding for pages that do not set their own
  title (e.g. the home redirect to `/dashboard`), `template` is
  `"%s | Salesforce Lite CRM"` so any page exporting a string title
  automatically gets the brand suffix.
- Added a `metadata: Metadata` export to every Claude-owned list page
  (13 routes total), each with a one-line title that mirrors the
  page's `PageHeader` title:
  - `/dashboard` → "Dashboard"
  - `/accounts` → "Accounts"
  - `/contacts` → "Contacts"
  - `/deals` → "Deals"
  - `/leads` → "Lead Inbox"
  - `/activities` → "Activities"
  - `/tasks` → "Tasks"
  - `/cases` → "Cases"
  - `/campaigns` → "Campaigns"
  - `/orders` → "Dealer Orders"
  - `/areas` → "Areas"
  - `/forecast` → "Forecast Simulator"
  - `/reports` → "Reports"
- Effect: browser tabs now disambiguate by page (e.g. "Accounts |
  Salesforce Lite CRM" vs "Dealer Orders | Salesforce Lite CRM")
  rather than all tabs reading "Salesforce Lite CRM". The change is
  Next.js metadata API only — no rendered DOM changes, no client-side
  state, no business logic.
- Each affected file gained one new import (`import type { Metadata }
  from "next";`) and four new lines (the metadata export block) right
  after `export const dynamic = "force-dynamic";`. No imports removed,
  no existing code changed.
- Detail pages (`/accounts/[id]`, `/contacts/[id]`, `/leads/[id]`,
  `/orders/[id]`, `/reports/[slug]`) and form pages (`/accounts/new`,
  `/contacts/new` n/a, `/deals/new`, `/tasks/new`, `/cases/new`,
  `/campaigns/new`) intentionally not touched this iteration —
  dynamic titles per record require `generateMetadata` and a thin
  extra Prisma query; deferred to next iteration to keep this commit
  reviewable.

### Verification

- `npm run build` → SUCCESS (32 routes; Next.js 16 metadata API
  accepts the `default`/`template` object plus per-page string
  titles cleanly).
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

Seven categories of polish on this branch:
1. metadata + product framing alignment (e0f138c, 2b7f8da)
2. copy precision on form/empty surfaces (468fb4a, ca0f472, 642ed78, a93f85a)
3. perceived-perf parity for detail routes (07a19cb)
4. graceful 404 boundary (0fba7d3)
5. interactive filter parity across list pages (0a33253)
6. internal documentation clarity (bd6468a)
7. browser tab disambiguation (2098a38, dba0fce)

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued`; Claude has now
landed sixteen S4-F2 implementation commits across recent iterations.
Per PLAN.md §2 the local gate is authoritative; the visual QA sweep
is materially complete on demo-critical routes and is extending into
metadata, descriptive accuracy, empty-state patterns, filter
interactions, documentation copy, and browser-tab UX.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`) that gate un-skipping
`e2e/demo-path.spec.ts`. Those live in Grok's zone; no action from
Claude this prompt.

### Next action

Add `generateMetadata` exports to the five detail pages
(`/accounts/[id]`, `/contacts/[id]`, `/leads/[id]`, `/orders/[id]`,
`/reports/[slug]`) so each open detail tab shows the actual record
name (Account name, Contact full name, Lead full name, Dealer Order
name, Report title). This requires a thin extra Prisma query per
detail page render, deduped via React `cache()` where it makes sense
(reports/[slug] reads no DB).

### Scope confirmation

No cross-ownership edits: YES (all fourteen edited files live in
`app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — Next.js metadata API only).
