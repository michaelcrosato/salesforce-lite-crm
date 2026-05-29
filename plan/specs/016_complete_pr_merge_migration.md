# 016 — Complete the PR-based merge migration & enforce_admins (TICKET009)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 4/5 · Feasibility 3/5 · Risk Med · Codebase Fit 5/5
- **Depends on:** none (docs already landed via PR #7)
- **Scope gate:** In-scope; **`enforce_admins=true` is the final, irreversible-feeling step** — do it only after the runner is proven PR-aware (CLAUDE.md §14: forced-git/branch-protection changes need explicit scope — this spec IS that scope)
- **Related:** TICKET009, `scripts/autonomy-loop.ps1`, `scripts/start-codex-overnight.ps1`, branch protection via `gh api`

## Description & Expected Impact
The documentation now mandates the gated PR flow (push branch → PR → green `gate` → squash-merge, never `--admin`), but the overnight runner `scripts/start-codex-overnight.ps1` still defaults `-AllowMain -Push`, pushing `main` directly and **bypassing** protection (the run identity is a repo admin). Close the loop so the automation stops bypassing.

Impact: the autonomous loop lands changes the same legitimate, gated way a human does — the last piece of the "PR flow is the only path" goal.

## Definition of Done & Acceptance Criteria
- [x] Runner default changes to **branch mode**, AND an automated **PR-open + watch-gate + squash-merge** step is added — landed **together** (branch-mode alone would strand green branches and stall `main`).
- [x] The runner never uses `--admin`/force; on red `gate` it leaves the PR open + files a `gate` blocker and stops.
- [x] A full **dry-run iteration** merges via PR + green `gate` on a throwaway feature, verified end-to-end.
- [x] **Only then:** `enforce_admins=true` set via `gh api`; verified that a direct push to `main` is now *rejected* (not bypassed).
- [x] TICKET009 acceptance boxes checked.

## Implementation Approach
**Files to touch:** `scripts/autonomy-loop.ps1` (`Push-GreenBranchIfRequested`, `Ensure-BranchPolicy`), `scripts/start-codex-overnight.ps1` (`Get-LoopArguments` defaults), branch protection via `gh api repos/michaelcrosato/salesforce-lite-crm/branches/main/protection`.

- Pair the two halves in one change set; keep the gated-merge helper shared.
- Sequence strictly: branch-mode + auto-merge → dry-run proof → `enforce_admins` flip last.

## Test Strategy
- **Dry-run:** execute one loop iteration on a throwaway branch; confirm it opens a PR, waits for `gate`, squash-merges, deletes the branch, no `--admin`.
- **Negative test (post-flip):** attempt a direct `git push origin main` as admin; confirm GitHub rejects it.
- Risk control: if the auto-merge step is unreliable, do **not** flip `enforce_admins` — that would hard-stall the loop.
