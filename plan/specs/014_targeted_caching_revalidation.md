# 014 — Targeted caching/revalidation (retire blanket `force-dynamic`)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 4/5
- **Depends on:** 013 (e2e must reliably guard data-freshness before changing caching)
- **Scope gate:** In-scope (perf/config); preserves all current behavior/non-goals
- **Related:** all 24 `app/**/page.tsx` (`export const dynamic = "force-dynamic"`), `next.config.mjs`, `app/*/actions.ts`, Next 16 Cache Components

## Description & Expected Impact
**Every one of the 24 pages is `force-dynamic`**, so each request re-queries SQLite even for read-heavy, rarely-changing lists. Next 16's **Cache Components** (`cacheComponents: true` + the `use cache` directive) make caching opt-in with per-request dynamic by default, and pair with **`updateTag()`** (read-your-writes, Server-Actions-only) so a deal/lead mutation immediately reflects in cached lists. Research indicates 60–80% TTFB reduction potential on cacheable shells.

Impact: large perceived-performance win on lists/dashboards without sacrificing correctness, using first-party Next 16 primitives.

## Definition of Done & Acceptance Criteria
- [ ] `next.config.mjs` enables `cacheComponents: true`.
- [ ] Read-heavy list pages (e.g. `/accounts`, `/contacts`, `/leads`, `/orders`, `/reports`) use `use cache` + `cacheTag(...)` on their cacheable data reads; pages with inherently live data (dashboard KPIs) stay dynamic — **decision documented per route**.
- [ ] Mutating server actions call `updateTag(tag)` (or `revalidateTag(tag, 'max')`) so created/edited records appear immediately.
- [ ] e2e proves freshness: create a lead → it appears in the list without a hard refresh; edit a deal → kanban reflects it.
- [ ] `npm run build` shows the intended static/dynamic split; full gate + e2e green.

## Implementation Approach
**Files to touch:** `next.config.mjs`, the cacheable `app/**/page.tsx`, the data-fetch helpers they call, and `app/*/actions.ts` (tag invalidation).

- Migrate **incrementally, one route at a time**, each behind its own commit + green e2e.
- Tag by entity (`leads`, `deals`, `accounts`…); invalidate the right tags in each mutating action.
- Note `revalidateTag` now requires a `cacheLife` profile as its 2nd arg in Next 16 — use `updateTag()` from Server Actions for read-your-writes.

## Test Strategy
- **e2e (Playwright):** create/edit/delete → assert list/kanban freshness (this is the safety net that makes caching safe).
- **Build assertion:** confirm the static/dynamic route classification matches the documented plan.
- **Regression:** the 565 unit tests are unaffected (server-component data fns unchanged in shape).
