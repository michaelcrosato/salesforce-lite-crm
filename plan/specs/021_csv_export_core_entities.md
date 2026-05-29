# 021 — CSV export for core entities

- **Wave:** Phase 2 — Major Features
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Low · Codebase Fit 4/5
- **Depends on:** 019 (export respects active filters/saved view)
- **Scope gate:** **Export is in-scope.** ⚠️ **Import-apply is a permanent non-goal beyond the bounded Sprint 40 contact-create path** — do NOT build general CSV import here; file a promotion request if import is wanted.
- **Related:** `lib/server/**` CSV contract layer (reuse the deterministic CSV math), `app/list-selected-export-actions.ts`, list pages

## Description & Expected Impact
CSV export is a universal CRM expectation and is **already partially present** — there is a `list-selected-export-actions.ts` and a large deterministic CSV contract layer in `lib/server`. Wire a clean "Export" affordance on the core entity lists (Leads, Deals, Accounts, Contacts) that emits a CSV of the **currently filtered/selected** rows, reusing the existing CSV generation.

Impact: lets users get their data out — a credibility feature — while productively reusing the otherwise under-consumed `lib/server` CSV code (synergy with spec 011's reachability cleanup: exporting gives some of that code a *live* consumer).

## Definition of Done & Acceptance Criteria
- [x] Each of Leads/Deals/Accounts/Contacts lists has an Export action producing a well-formed CSV (RFC 4180 quoting) of the active view's rows.
- [x] Export honors the current filter/saved view (spec 019) and selection (spec 020) when present.
- [x] CSV generation reuses existing deterministic `lib/server` CSV utilities where applicable (and is noted in spec 011's reachability log as a now-live consumer).
- [x] No import-apply added (respect the non-goal).
- [x] Gate + e2e green.

## Implementation Approach
**Files to touch:** `app/list-selected-export-actions.ts` (extend per entity), list-page `components/**` (Export button), `lib/server/**` CSV helpers (reuse), `lib/validation.ts` (export request schema).

- Stream/return the CSV via a server action or a route handler that sets `Content-Type: text/csv` + `Content-Disposition`. (A read-only export route handler is acceptable; it is not a new *product* route in the non-goal sense — confirm in PLAN review.)
- Reuse existing CSV escaping; do not reinvent quoting.

## Test Strategy
- **Unit:** CSV serialization (quoting commas/quotes/newlines, header row, deterministic column order) over fixture rows.
- **e2e:** click Export → assert a CSV download with expected header + row count for a filtered list; `data-testid` `leads-export-btn` (kebab-case) for Gemini.
