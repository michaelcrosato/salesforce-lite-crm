Agent: claude
Sprint: 4 (S4-F2 — Route visual QA, queued in PLAN.md §4)
Feature: demo-path e2e testid hooks (Claude-zone subset of Gemini BLOCKERS #3)
Branch: claude/autonomy
Status: active
Commits this prompt: 81f438f — [claude] S4-F2: add demo-path e2e testids in app pages
Gate status: PASS — npm run test (162/162) + npm run build (clean, 31 routes)
DoD self-check: PASS
Timestamp: 2026-05-18T23:19:00-08:00

### Completed this prompt

- Added six `data-testid` hooks in three Claude-owned app/** pages so Gemini can
  un-skip `e2e/demo-path.spec.ts` (currently `test.skip` per its BLOCKERS #3).
  All edits are attribute-only — no business logic, no component primitive
  edits, no cross-zone changes.
  - `app/dashboard/page.tsx`:
    - `data-testid="dashboard-analyst-panel"` on the Analyst Panel `<Card>`.
    - `data-testid="analyst-item-behind-pace-order"` on each behind-pace
      order `<Link>` rendered in the Behind-Pace Orders list (multiple
      instances; tests can `.first()`).
  - `app/forecast/page.tsx`:
    - `data-testid="forecast-multiplier-input"` on the multiplier `<Input>`.
    - `data-testid="forecast-apply-button"` on the Apply submit `<Button>`.
    - `data-testid="forecast-projection-value"` on a wrapper `<div>` around
      the "Projected Leads" `<KpiCard>` (KpiCard primitive is Grok zone;
      wrapping at the app level avoids touching components/**).
  - `app/leads/[id]/page.tsx`:
    - `data-testid="lead-status-badge"` on the wrapper `<div>` around the
      assignment-reason `<Badge>` (Badge primitive is Grok zone; wrapping
      at the app level avoids touching components/**).

### Testid catalog (this prompt — for Gemini's demo-path spec)

| testid | Where | Use |
|---|---|---|
| `dashboard-analyst-panel` | `app/dashboard/page.tsx` analyst Card | visibility assertion |
| `analyst-item-behind-pace-order` | each `<Link>` in dashboard Behind-Pace Orders | `.first()` + `toContainText("Vancouver")` |
| `forecast-multiplier-input` | `<Input id="multiplier">` | `.fill("2")` |
| `forecast-apply-button` | Forecast form submit `<Button>` | `.click()` |
| `forecast-projection-value` | wrapper `<div>` around "Projected Leads" KpiCard | `.not.toHaveText("$0.00")` (number, not currency — semantics: not-zero check) |
| `lead-status-badge` | wrapper `<div>` around assignment-reason Badge on `/leads/[id]` | assertion on routed badge |

### Demo-path testids still unowned by Claude (Grok zone — components/**)

These remain blocking `e2e/demo-path.spec.ts` from being un-skipped. They live
in Grok-owned components and are out of Claude's zone:

- `lead-form-submit` — `components/lead-form.tsx`
- `routing-detail-success`, `routing-detail-link` — `components/routing-decision-detail.tsx`
- `contact-note-input`, `contact-note-submit` — `components/add-note-form.tsx`
- `activity-timeline-summary` — `components/activity-timeline.tsx`

### Next action

If next iteration's prompt continues S4-F2, sweep the remaining demo-critical
routes (`/orders`, `/orders/[id]`, `/areas`, `/accounts`, `/contacts`, `/deals`)
for visual coherence in page-level layouts. Otherwise wait for Gemini to
un-skip `demo-path.spec.ts` once the Grok-zone testids land and report any
follow-up adjustments needed in the app-level wrappers.

### Scope confirmation

No cross-ownership edits: YES (all three edited files live in `app/**`).
CRM-CONTRACT.md honored: YES (no contract edits; no schema, route, or status
value changes — pure attribute additions).
