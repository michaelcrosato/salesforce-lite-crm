# 030 — Retire Remaining Non-CSV Orphans & Reachability Ratchet Zero

- **Wave:** Wave 6 — Complete Reachability Zero-Orphans Ratchet
- **Status:** [x] Done
- **Scores:** Impact 3/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 029 (retire dead CSV tower)
- **Scope gate:** Delete the remaining 2 unreferenced test-only server files + their test files. Lower the reachability baseline `maxOrphans` from `2` to `0`. No product changes.
- **Related:** `lib/server/bulkListSelectionContracts.ts`, `lib/server/workflowRuleExecutionReceipts.ts`, `scripts/reachability-baseline.json`

## Description & Expected Impact
We successfully retired the legacy dead CSV tower in Spec 029. Only two non-CSV unreferenced, test-only server contract files remain: `bulkListSelectionContracts.ts` and `workflowRuleExecutionReceipts.ts`. Retiring these two will allow us to tighten the reachability ratchet all the way to **zero** allowed orphans, ensuring that any new unreferenced server code added in the future immediately fails the gate locally and on CI.

Impact: Enforces a strict, automated "consumer before code" invariant with **zero allowed orphans** across `lib/server/`.

## Definition of Done & Acceptance Criteria
- [x] Delete `lib/server/bulkListSelectionContracts.ts` and its test `tests/api/bulk-list-selection-contracts.test.ts`.
- [x] Delete `lib/server/workflowRuleExecutionReceipts.ts` and its test `tests/api/workflow-rule-execution-receipts.test.ts`.
- [x] Update `scripts/reachability-baseline.json` to prune these files and set `maxOrphans` and `allowedOrphans` to `0` / empty list.
- [x] Verify that `npm run agent:check` passes completely green.

## Implementation Approach
**Files to delete:** 2 source files and 2 test files (listed above)
**Files to modify:** `scripts/reachability-baseline.json`

1. Run `git rm` on the 2 source files and 2 test files.
2. Update `scripts/reachability-baseline.json` to have empty allowed orphans.
3. Validate by running the local gate checks.

## Test Strategy
- **Quality Gate Validation**: The `agent:check` script is our safety net.
- **Reachability check**: Verify `node scripts/check-reachability.mjs` runs and succeeds with `0` allowed orphans.
