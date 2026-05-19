Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: S4-F2 route visual QA — list page header layout fix
Branch: claude/autonomy
Status: active
Commits this prompt: 9b98e72 — [claude] S4-F2: enable side-by-side header layout on list pages
Gate status: PASS — npm run test (162/162) + npm run build (clean, 32 routes) + npm run test:e2e (19 passed, 1 demo-path skipped)
DoD self-check: PASS
Timestamp: 2026-05-19T02:25:00-08:00

### Completed this prompt

- Route visual QA audit across all S4-F2 demo-critical routes:
  - `/dashboard`, `/leads`, `/leads/[id]`, `/orders`, `/orders/[id]`,
    `/areas`, `/forecast`, `/accounts`, `/accounts/[id]`, `/contacts`,
    `/contacts/[id]`, `/deals`.
  - All use the shared `crm-page` wrapper, `PageHeader`, Card-based
    sections, badge variants, and `EmptyState` for empty lists.
  - `/deals/[id]` correctly renders the `ExcludedRoutePlaceholder` per
    CRM-CONTRACT.md feature flag — no drawer-flow violation.
- Found and fixed one real visual-coherence bug at the page level:
  three list pages declared `sm:flex-row sm:items-center
  sm:justify-between` on `CardHeader` but never set the base
  `display:flex`, so the intended title-left/search-right layout
  silently degraded to a stacked layout at every viewport. Added
  `sm:flex` to honor the original intent at sm+ breakpoints.
  - `app/accounts/page.tsx` — Account List header
  - `app/contacts/page.tsx` — Contact Directory header
  - `app/activities/page.tsx` — Activity Feed header
- All changes are attribute-only at the app-router page level. No
  business logic, no component primitives, no schema, no route
  contract changes. No cross-zone edits.

### Visual coherence findings (no fix needed)

| Route | Notes |
|---|---|
| `/dashboard` | Coherent. KPI grid, analyst panel cards, Dealer Ops, Today's Focus all use shared Card/Badge primitives and have empty states. |
| `/leads` | Coherent. Filter form in CardHeader with Apply button; routing-detail row beneath each lead row. EmptyState wired. |
| `/leads/[id]` | Coherent. Two-column lead summary / activity timeline with assignment sidebar. `lead-status-badge` wrapper in place. |
| `/orders` | Coherent. Wide pacing table with `max-w-[1500px]`. Pacing bar, status badge, expected-delivered all aligned. |
| `/orders/[id]` | Coherent. Two-column assigned-leads/timeline with order summary sidebar including pacing bar. |
| `/areas` | Coherent. Postal prefix table with badge chips and linked order list per row. |
| `/forecast` | Coherent. Scenario inputs card, KPI grid (including `forecast-projection-value` wrapper), order projection table, "How This Works" explainer. |
| `/accounts` | Coherent after fix; uses shared `AccountsTable`. Header now properly side-by-side at sm+. |
| `/accounts/[id]` | Coherent. Summary grid, collapsible edit `<details>`, related contacts/deals tables, recent activities. |
| `/contacts` | Coherent after fix. Header now properly side-by-side at sm+. Inline ContactForm + ContactsTable. |
| `/contacts/[id]` | Coherent. Two-column summary/deals/timeline with edit form + add-note sidebar. |
| `/deals` | Coherent. KPI row + drag-and-drop DealBoard; drawer flow preserved; EmptyState wired. |

### Next action

If next iteration's prompt continues S4-F2, sweep the remaining
non-demo-critical routes (`/tasks`, `/cases`, `/campaigns`,
`/reports`, `/activities`) for the same header-flex pattern or other
page-level coherence issues. Otherwise wait for Gemini to un-skip
`demo-path.spec.ts` once Grok lands the components/**-side testids
(`lead-form-submit`, `routing-detail-success`, `routing-detail-link`,
`contact-note-input`, `contact-note-submit`,
`activity-timeline-summary`).

### Scope confirmation

No cross-ownership edits: YES (all three edited files live in `app/**`).
CRM-CONTRACT.md honored: YES (no contract edits; no schema, route, or
status value changes — pure className additions on CardHeader).
