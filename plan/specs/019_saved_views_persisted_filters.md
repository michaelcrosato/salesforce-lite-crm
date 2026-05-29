# 019 — Saved views + persisted per-entity filters/sort

- **Wave:** Phase 2 — Major Features
- **Status:** [ ] Todo
- **Scores:** Impact 5/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 014 (caching/tags interact with filtered list reads)
- **Scope gate:** Likely in-scope — `SavedListView` model + `app/saved-list-views` actions **already exist**; this extends them. **Confirm against PLAN.md §4 before building**; if PLAN treats list-view expansion as a non-goal, file a promotion request first.
- **Related:** `prisma/schema.prisma` (`SavedListView`), `app/saved-list-views*`, Leads/Deals list pages, competitor parity (Twenty table/kanban saved views)

## Description & Expected Impact
The single highest-leverage parity feature versus modern CRMs (Twenty, EspoCRM). A `SavedListView` model already exists, so the foundation is present — extend it to persist **filters, sort, and visible columns per entity**, and surface a saved-views switcher on the Leads and Deals lists. This is the feature users hit on day one of any real CRM.

Impact: transforms static lists into a configurable workspace; biggest perceived "this is a real CRM" jump.

## Definition of Done & Acceptance Criteria
- [ ] A user can save the current filter/sort/column config of the Leads (and Deals) list as a named view, switch between views, and set a default.
- [ ] Views persist via the existing `SavedListView` model (extend fields only if needed; **any schema change requires explicit scope + `docs/schema-changelog.md` entry** — prefer storing the config as validated JSON in an existing column).
- [ ] Filters/sort are Zod-validated at the action boundary and applied server-side in the Prisma query.
- [ ] e2e covers: create view → reload → view persists + applies; delete view.
- [ ] Gate + e2e green.

## Implementation Approach
**Files to touch:** `app/leads/*`, `app/deals/*` (list UI + view switcher), `app/saved-list-views*` actions, `components/**` (a saved-view control), `lib/services/*` (apply filter/sort to queries), `lib/validation.ts` (filter schema).

- Reuse the existing saved-view plumbing; avoid a parallel system.
- Encode the view config as a typed, Zod-validated JSON blob to avoid a schema migration if the current model can hold it.
- Keep deterministic ordering (stable tie-breakers) so paginated/sorted results are reproducible.

## Test Strategy
- **Unit:** filter/sort schema validation + query builder (assert the Prisma `where`/`orderBy` produced for a given saved config).
- **e2e:** the persistence + apply flow above; **a new `data-testid` set** (`leads-view-switcher`, `deals-view-save`, kebab-case) for the Gemini test zone.
