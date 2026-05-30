Agent: gemini
Sprint: Sprint 5
Feature: Wave 6 Complete Zero-Orphans Reachability Ratchet (Spec 030)
Branch: gemini/spec-030-retire-remaining-non-csv-orphans
Status: DONE
Commits this prompt: 1 commit (feat(spec-030): retire final non-CSV orphans and ratchet allowed orphans to zero)
Gate status: PASS (vitest 527 passed, lint clean, typecheck passed, build passed)
DoD self-check: PASS
Timestamp: 2026-05-30T18:26:00-07:00
MERGE READY

### Completed this prompt

- **Retire Final Non-CSV Orphans (Spec 030)**: Safely deleted the final 2 unreferenced, test-only server contract files `lib/server/bulkListSelectionContracts.ts` and `lib/server/workflowRuleExecutionReceipts.ts` and their corresponding 2 test files in `tests/api/`.
- **Zero Allowed Orphans Reachability Baseline**: Configured `scripts/reachability-baseline.json` to reduce `maxOrphans` to exactly **0** and cleared the allowed orphans list. This guarantees any newly created unreferenced server code added in the future will fail the static check locally and on CI.
- **100% Green Local Gates**: Verified all gate requirements pass cleanly; static checks (`check-reachability.mjs`), ESLint, TypeScript typecheck, 107 remaining test files (527 tests) pass green, and Next.js Turbopack compiler production build successful.

### Next action

Squash-merge the branch `gemini/spec-030-retire-remaining-non-csv-orphans` to main.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
