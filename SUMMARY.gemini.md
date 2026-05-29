Agent: gemini
Sprint: Sprint 5
Feature: Spec 014 — Targeted Caching & Revalidation
Branch: gemini/autonomy
Status: DONE
Commits this prompt: 2 commits (caching/revalidation implementation & progress tracking updates)
Gate status: PASS
DoD self-check: PASS
Timestamp: 2026-05-29T05:48:00-07:00

### Completed this prompt

- **Deals Caching & Invalidation**: Extracted all database reads on `/deals` into a type-safe `getCachedDeals` helper marked with `"use cache"` and `cacheTag("deals")`. Added `updateTag("deals")` inside `createDealAction`, `updateDealAction`, and `moveDealAction` in `app/deals/actions.ts`.
- **Orders Caching**: Wrapped `/orders` database query inside a type-safe `getCachedOrders(start, end)` helper using `"use cache"` and `cacheTag("orders")`.
- **Reports Caching & Invalidation**: Added type-safe caching wrappers (`getCachedPipelineByStage`, `getCachedLeadsBySource`, etc.) in `/reports/[slug]/page.tsx` and list data reads in `/reports/page.tsx` using `cacheTag("reports")`. Integrated `updateTag("reports")` in all mutating saved report actions in `app/reports/actions.ts` (create, update, archive, and delete).
- **Leads Invalidation**: Integrated `updateTag("leads")` in `revalidateDealerOpsPaths` within `app/leads/actions.ts` to invalidate cached lead views when leads are mutated.
- **Vitest Mocks Correction**: Resolved unused import in `app/leads/actions.ts` and successfully patched all 8 test mock files in `tests/api` to export `updateTag` under mocked `"next/cache"`.
- **Gate Validation & Merging**: Ran full workspace gate (`npm run agent:check`) with 100% green status (562 passing unit/integration tests, clean typescript check, and eslint pass). Verified production compilation succeeds with all dynamic route paths building under Partial Prerendering (`◐ (Partial Prerender)`). Merged changes into `main` and successfully pushed to origin.

### Next action

Proceed to the next unblocked wave task in the queue.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
