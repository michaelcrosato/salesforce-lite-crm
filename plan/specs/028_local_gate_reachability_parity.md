# 028 — Local Gate Reachability Parity

- **Wave:** Wave 4 — Continuous Safety & Parity
- **Status:** [x] Done
- **Scores:** Impact 3/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** — (Independent)
- **Scope gate:** Add `scripts/check-reachability.mjs` run step into `scripts/local-gate.ps1` and `scripts/local-gate.sh`. No product changes.
- **Related:** `scripts/local-gate.ps1`, `scripts/local-gate.sh`, `.github/workflows/ci.yml`

## Description & Expected Impact
Today, `.github/workflows/ci.yml` runs `node scripts/check-reachability.mjs` as an early deterministic check in the CI gate. However, this step is completely missing from the local gate scripts (`scripts/local-gate.ps1` and `scripts/local-gate.sh`). This creates a parity gap where reachability drift (e.g. creating orphaned packet tower files) is caught only on CI after pushing, rather than locally.

Impact: Ensures local developers get immediate reachability validation feedback before committing or pushing changes, guaranteeing local-to-CI gate parity.

## Definition of Done & Acceptance Criteria
- [x] Add `node scripts/check-reachability.mjs` as a blocking gate step in `scripts/local-gate.ps1`.
- [x] Add `node scripts/check-reachability.mjs` as a blocking gate step in `scripts/local-gate.sh`.
- [x] Run both scripts and ensure they pass successfully when the workspace has no reachability drift.
- [x] Verify that introducing a reachability drift (e.g., an orphaned `lib/server/testOrphan.ts` not imported anywhere) causes the local gates to fail with a non-zero exit code, matching the CI behavior.

## Implementation Approach
**Files to touch:** `scripts/local-gate.ps1`, `scripts/local-gate.sh`

1. In `scripts/local-gate.ps1`, insert:
   ```powershell
   Invoke-GateStep "node scripts/check-reachability.mjs" { & node scripts/check-reachability.mjs }
   ```
   right after the `npm install` check.
2. In `scripts/local-gate.sh`, insert:
   ```bash
   echo ""
   echo "==> node scripts/check-reachability.mjs"
   node scripts/check-reachability.mjs
   ```
   right after the `npm install` step.
3. Validate by running the local gate scripts.

## Test Strategy
- **Manual Verification**: Run `powershell -File scripts/local-gate.ps1` and `bash scripts/local-gate.sh` locally to confirm success on clean main.
- **Drift Test**: Temporarily create a dummy unused file under `lib/server/` and verify the local gate correctly halts and prints the reachability error.
