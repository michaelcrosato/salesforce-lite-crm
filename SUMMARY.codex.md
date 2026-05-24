Agent: Codex

Sprint: 33

Feature: S33-F1 - Knowledge article foundation

Branch: main

Status: done

Commits this prompt:
- 33c0136 - [codex] S33-F1: add knowledge article foundation

Gate status: PASS - Full local gate via `powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1` exited 0: npm install, Prisma generate/db push, seed, lint, typecheck, 73 Vitest files / 392 tests, build, Playwright chromium install, and 22 e2e tests.

DoD self-check: PASS

Timestamp: 2026-05-24T15:29:29.2037324-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran Phase 0 baseline on `main` in single-agent root mode; worktree was clean and install, Prisma generate/db push, seed, lint, typecheck, test, and build were green before edits.
- Reconciled current coordination docs and noted a stale historical Gemini SUMMARY claiming a Sprint 5 visual snapshot scope that does not match current PLAN §4 Sprint 5 history.
- Added the local `KnowledgeArticle` schema in SQLite and Postgres Prisma schemas with owner relation, status/audience/category/queue metadata, published timestamp, indexes, and seeded article examples.
- Added knowledge article registry constants, validation schemas, service helpers, crmClient exports, and `knowledge_article` audit entity support without adding routes, nav, external providers, search expansion, or article admin UI.
- Updated `CRM-CONTRACT.md` and `docs/schema-changelog.md` for the S33-F1 entity/adapter/schema surface.
- Added Vitest coverage for knowledge article service behavior, validation rejection, seeded article integrity, and audit evidence.

### Next action

Run LOOP.md to begin S33-F2 - Case knowledge suggestion contracts.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; S33-F1 coherently spanned schema, seed, service, contract, and tests)

CRM-CONTRACT.md honored: YES
