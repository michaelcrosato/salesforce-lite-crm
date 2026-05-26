Agent: Codex

Sprint: 43

Feature: S43-F1 - Knowledge article route contract

Branch: main

Status: done

Commits this prompt:
- cbb8da5 - [codex] S43-F1: add knowledge route contract

Gate status: PASS - Baseline and post-change `scripts/local-gate.ps1` both passed. Post-change gate included npm install, Prisma generate/db push, seed, lint, typecheck, Vitest (92 files / 468 tests), build, Playwright chromium install, and e2e (24 tests).

DoD self-check: PASS

Timestamp: 2026-05-26T02:46:12.3004173-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Ran the full Phase 0 local gate successfully before implementation.
- Promoted `KnowledgeArticle` route metadata to the CRM contract with `/knowledge` and `/knowledge?article=<id>` while keeping standalone `/knowledge/[id]` detail routes excluded.
- Added `KnowledgeArticle` registry metadata plus `ROUTE_REGISTRY.knowledgeArticles` and `ROUTE_REGISTRY.knowledgeArticleDetail`.
- Added focused registry/feature-flag tests for the knowledge route contract and excluded-route stability.
- Re-ran the full local gate successfully after the implementation.

### Next action

Run LOOP.md to begin S43-F2 - Knowledge article operator workspace.

### Scope confirmation

No cross-ownership edits: YES (single-agent root mode; historical zones were advisory)

CRM-CONTRACT.md honored: YES
