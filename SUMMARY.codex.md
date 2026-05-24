Agent: Codex

Sprint: 29

Feature: S29-F2 - Saved list views foundation

Branch: main

Status: done

Commits this prompt:
- 7c2f668 - [codex] S29-F2: add saved list view foundation

Gate status: PASS - `scripts/local-gate.ps1` exited 0; `npm run test` passed 66 files / 359 tests and `npm run test:e2e` passed 19 tests.

DoD self-check: PASS

Timestamp: 2026-05-23T17:20:23.4425028-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `SavedListView` to the SQLite and Postgres Prisma schemas with entity/name uniqueness, serialized filter JSON, sort metadata, optional page size, and timestamps.
- Added `lib/services/savedListViews.ts` with create/list/get/update/delete helpers plus `buildSavedListViewQuery()` for applying saved filters/sorts or preserving the current query when no saved view is selected.
- Validated saved-view entities, filters, enum values, date filters, sort keys, and sort order against the existing list-filter support catalog.
- Added Vitest coverage for create/list, current-query passthrough, saved-view application, update/get/delete, and rejection of unsupported saved-view inputs without writes.
- Documented the schema addition in `docs/schema-changelog.md`; `CRM-CONTRACT.md` was not changed.

### Discovered this prompt

- PLAN.md §4 still marks S29-F1 as `queued`, but Codex SUMMARY, implementation commits, and the green baseline gate show S29-F1 completed on `main`.
- Other agents' root SUMMARY/BLOCKERS files remain historical parallel-branch context; no active blocker in those files changes the current Sprint 29 Codex queue on `main`.

### Next action

Run LOOP.md for S29-F3 - Saved list views operator UI.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; full-repo files were touched only for the S29-F2 schema, service, tests, and schema changelog)

CRM-CONTRACT.md honored: YES
