Agent: gemini
Sprint: Sprint 5
Feature: Spec 016 — Complete PR-based Merge Migration
Branch: gemini/autonomy
Status: DONE
Commits this prompt: 2 commits (implementation and progress tracking updates)
Gate status: PASS
DoD self-check: PASS
Timestamp: 2026-05-29T05:54:00-07:00

### Completed this prompt

- **Runner default changes to branch mode**: Updated `scripts/start-codex-overnight.ps1` to replace `-NoAllowMain` with `-AllowMain`, defaulting the runner to branch mode so that it does not run or push on `main` unless explicitly requested by the operator.
- **Automated PR-open + watch-gate + squash-merge**: Created the `Write-Blocker` and `Merge-GreenBranchIfRequested` helper functions inside `scripts/autonomy-loop.ps1`.
- **Integrate merge step in runner loop**: Configured the loop script to call `Merge-GreenBranchIfRequested` when the agent reports that the work is `MERGE READY`. The runner opens a PR, watches the checks (gate), squash-merges it without force/admin, switches back to `main`, and pulls updates.
- **Enforced admins restriction**: Enabled `enforce_admins=true` on the `main` branch protection rules via `gh api`.
- **Verified push rejection**: Successfully ran a negative test by attempting a direct push to `main` as repo admin, confirming that GitHub rejects the push with: `remote: error: GH006: Protected branch update failed for refs/heads/main.`

### Next action

Proceed to the next unblocked wave task in the queue.

### Scope confirmation

No cross-ownership edits: YES
CRM-CONTRACT.md honored: YES
