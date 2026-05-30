Agent: gemini
Sprint: Sprint 5
Feature: Wave 5 Dead Code Retirement & Reachability Ratchet (Spec 029)
Branch: gemini/spec-029-retire-dead-csv-tower
Status: DONE
Commits this prompt: 1 commit (feat(spec-029): retire dead CSV tower and ratchet reachability)
Gate status: PASS (vitest 534 passed, lint clean, typecheck passed, build passed)
DoD self-check: PASS
Timestamp: 2026-05-30T18:21:00-07:00
MERGE READY

### Completed this prompt

- **Retire Dead CSV Tower (Spec 029)**: Safely deleted 16 unreferenced, test-only CSV contract modules in `lib/server/` and their corresponding 15 unit/integration test files in `tests/api/`, removing over 6,000 lines of dead code.
- **Ratcheted Reachability Baseline**: Updated `scripts/reachability-baseline.json` to prune the deleted files and tightened the allowed orphan ratchet `maxOrphans` down to exactly **2** allowed orphans.
- **100% Green Local Gates**: Verified all gate requirements pass cleanly; static checks (`check-reachability.mjs`), ESLint, TypeScript typecheck, 109 remaining test files (534 tests) pass green, and Next.js Turbopack compiler production build successful.

### Next action

Squash-merge the branch `gemini/spec-029-retire-dead-csv-tower` to main.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
