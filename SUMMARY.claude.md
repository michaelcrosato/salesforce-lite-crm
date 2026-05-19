Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — /accounts filter Apply button parity
Branch: claude/autonomy
Status: active
Commits this prompt: 0a33253 — [claude] S4-F2: add Apply button to /accounts filter form for status submission
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes)
DoD self-check: PASS
Timestamp: 2026-05-19T06:55:00-08:00

### Completed this prompt

- Fixed a genuine UX gap on `/accounts/page.tsx`: the search + status
  filter form had no submit button, so changing the status `<Select>`
  produced no visible effect (only Enter from the `<Input>` would
  submit because of HTMLFormElement default submission). The status
  select silently failed to filter. Every other multi-field filter
  form in `app/**` ships an explicit submit button:
  - `/leads/page.tsx` — `<Button type="submit">Apply</Button>` in a
    4-column filter grid.
  - `/tasks/page.tsx` — `<Button type="submit">Apply filters</Button>`
    + `Reset` link in a 4-column filter card.
  - `/cases/page.tsx` — same Apply/Reset pair in a 3-column filter
    card.
  - `/campaigns/page.tsx` — same Apply/Reset pair in a 3-column filter
    card.
  - `/activities/page.tsx` — `<Button type="submit">Apply</Button>`
    in a 2-column type-filter row.
- `/accounts/page.tsx` filter is an inline form inside `CardHeader`
  rather than a dedicated Filters card, so the surgical fix is a new
  Apply button as a third grid column rather than restructuring into
  a separate filter card. Form `grid-cols` widened from `[1fr_160px]`
  to `[1fr_160px_auto]` and a `<Button type="submit" variant="secondary">Apply</Button>`
  appended; mirrors the inline-CardHeader Apply-button pattern used by
  `/leads/page.tsx` (4-col + nested `[1fr_auto]` for the rightmost
  source select + Apply).
- Added the missing `Button` import from `@/components/ui/button`.
- No business logic change. The form `action="/accounts"` and field
  names (`q`, `status`) are unchanged. The change is purely UI:
  one additional submit affordance with no new state, server action,
  or query-param shape.

### Verification

- `npm run build` → SUCCESS (32 routes; no new dependencies, no
  TypeScript regressions).
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
| `0a33253` | add Apply button to /accounts filter form |

The branch adds five categories of polish on top of the prior S4-F2
sweep (`81f438f`, `9b98e72`, `d51d817`):
1. metadata + product framing alignment (e0f138c, 2b7f8da)
2. copy precision on form/empty surfaces (468fb4a, ca0f472, 642ed78)
3. perceived-perf parity for detail routes (07a19cb)
4. graceful 404 boundary (0fba7d3)
5. interactive filter parity across list pages (0a33253)

### Reconciliation note

PLAN.md §4 still lists S4-F2 with `Status: queued` while Claude has
landed twelve S4-F2 implementation commits across recent iterations.
Per PLAN.md §2 the local gate is authoritative; the visual QA sweep
is materially complete on demo-critical routes and is extending into
non-demo-critical copy, perceived-perf, error-boundary, and filter-
interaction surfaces. No PLAN.md §4 edit attempted from this prompt
— the planning zone is shared.

### Outstanding cross-agent dependency

Gemini BLOCKERS #3 still tracks remaining `components/**`-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`) that gate un-skipping
`e2e/demo-path.spec.ts`. Those live in Grok's zone; no action from
Claude this prompt.

### Next action

Continue the S4-F2 sweep into:
- `/forecast/page.tsx` and `/deals/page.tsx` — visually re-read for
  empty-state, header-button, and filter parity issues.
- `/leads/[id]/page.tsx` and `/orders/[id]/page.tsx` detail pages —
  same parity sweep against the related list pages.
- `/dashboard/page.tsx` — re-read for term consistency vs the README
  and CRM-CONTRACT in the Analyst Panel + Dealer Ops cards.

### Scope confirmation

No cross-ownership edits: YES (single edited file lives in `app/**`).
CRM-CONTRACT.md honored: YES (no schema, route, status, or adapter
signature changes — purely an in-form submit affordance added on the
existing `/accounts` filter surface).
