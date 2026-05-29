Agent: gemini
Sprint: Sprint 5
Feature: Spec 019 — Saved views + persisted per-entity filters/sort
Branch: gemini/parallel-tests
Status: DONE
Commits this prompt: 1 commit (implementation, specs, and PROGRESS tracker update)
Gate status: PASS (vitest 564 passed, typecheck passed, eslint clean, build passed, Playwright E2E passed green)
DoD self-check: PASS
Timestamp: 2026-05-29T06:56:00-07:00
MERGE READY

### Completed this prompt

- **Updated Support Catalog**: Added the `source` equalsFilter to the leads catalog seed in `lib/server/listFilterSupportCatalog.ts` and updated metadata assertions in `tests/api/list-filter-support-catalog.test.ts` and `tests/api/saved-report-definitions.test.ts`.
- **Saved Views & Query Persistence for Leads**: Imported and integrated `SavedListViewControls` and `resolveLeadSavedViewQuery` into `app/leads/page.tsx`. Expanded `getCachedLeads` to accept `sortBy`, `sortOrder`, and `pageSize` parameters, ensuring filtering and sorting are resolved and applied dynamically from either the current query params or a selected/saved view.
- **Saved Views & Query Persistence for Deals/Opportunities**: Standardized the Kanban Deal Board page `app/deals/page.tsx` by adding a dynamic filter and saved views section using `SavedListViewControls` and `resolveDealSavedViewQuery`. Refactored `getCachedDeals` to accept `stage`, `accountId`, `ownerId`, `search`, `sortBy`, `sortOrder`, and `pageSize`, allowing full pipeline filter preservation.
- **Thorough Integration and E2E Tests**: Added comprehensive backend integration tests in `tests/api/saved-list-views.test.ts` for leads and opportunities saved views. Authored complete Playwright E2E tests in `e2e/saved-list-views.spec.ts` matching the persistence lifecycle (save -> reload -> verify -> update -> reload -> verify -> delete) for both Lead Inbox and Deals pipeline board, resolving strict mode locator violations.

### Next action

Awaiting merge of the gated branch `gemini/parallel-tests` into `main`.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
