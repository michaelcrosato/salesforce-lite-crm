# 029 — Retire Dead CSV Tower & Ratchet Baseline

- **Wave:** Wave 5 — Dead Code Retirement & Reachability Ratchet
- **Status:** [x] Done
- **Scores:** Impact 4/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** 011 (reachability gate), 028 (local gate reachability parity)
- **Scope gate:** Delete the 16 unreferenced test-only CSV tower files + their test files. Lower the reachability baseline `maxOrphans` from `18` to `2`. No product changes.
- **Related:** `lib/server/csv*`, `tests/api/csv-*.test.ts`, `scripts/reachability-baseline.json`

## Description & Expected Impact
During prior sprints, a deep stack of read-only CSV "handoff" contracts was built under the assumption they would be used in future workflows. However, these workflows were never added, leaving a tower of 16 unreferenced and orphaned server files and tests. These files are not imported by any UI components or page routes, but contribute significantly to the codebase's token and maintenance overhead.

Impact: Safely removes over 6,000 lines of dead code and tests, tightening our reachability gate ratchet down to only `2` allowed orphans (`bulkListSelectionContracts` and `workflowRuleExecutionReceipts`), drastically reducing project entropy.

## Definition of Done & Acceptance Criteria
- [x] Delete all 16 orphaned CSV modules under `lib/server/`:
  - `csvCompatibilityReports.ts`
  - `csvContractDriftSnapshots.ts`
  - `csvContractQaChecks.ts`
  - `csvContractReleaseDigest.ts`
  - `csvFieldCoverageSummaries.ts`
  - `csvHandoffIndex.ts`
  - `csvHandoffReleaseNotesPackets.ts`
  - `csvInFlightCache.ts`
  - `csvOperatorAcceptanceChecklists.ts`
  - `csvOperatorFixtureBundles.ts`
  - `csvOperatorHandoffPackets.ts`
  - `csvOperatorReadinessScorecards.ts`
  - `csvOperatorRemediationRunbooks.ts`
  - `csvOperatorWalkthroughManifests.ts`
  - `csvReleaseVerificationManifests.ts`
  - `csvTransferManifests.ts`
- [x] Delete their corresponding test files under `tests/api/`:
  - `csv-compatibility-reports.test.ts`
  - `csv-contract-drift-snapshots.test.ts`
  - `csv-contract-qa-checks.test.ts`
  - `csv-contract-release-digest.test.ts`
  - `csv-field-coverage-summaries.test.ts`
  - `csv-handoff-index.test.ts`
  - `csv-handoff-release-notes-packets.test.ts`
  - `csv-operator-acceptance-checklists.test.ts`
  - `csv-operator-fixture-bundles.test.ts`
  - `csv-operator-handoff-packets.test.ts`
  - `csv-operator-readiness-scorecards.test.ts`
  - `csv-operator-remediation-runbooks.test.ts`
  - `csv-operator-walkthrough-manifests.test.ts`
  - `csv-release-verification-manifests.test.ts`
- [x] Update `scripts/reachability-baseline.json` to prune the 16 removed files and lower `maxOrphans` from `18` to `2`.
- [x] Verify that `npm run agent:check` passes completely green (lint, typecheck, remaining vitest tests, and Turbopack production build).

## Implementation Approach
**Files to delete:** 16 source files and 14 test files (listed above)
**Files to modify:** `scripts/reachability-baseline.json`

1. Run `git rm` on each of the 16 source files and 14 test files.
2. Update `scripts/reachability-baseline.json` with the updated list and new maximum.
3. Validate by running the local gate checks.

## Test Strategy
- **Quality Gate Validation**: The `agent:check` script is our safety net. Since these modules are entirely unreferenced by live pages, removing them must not trigger any compilation errors.
- **Reachability check**: Verify `node scripts/check-reachability.mjs` runs and succeeds against the new ratchet baseline of `2` allowed orphans.
