# MERGE.md — integrate green agent branches into main

You are the operator (or whichever agent owns the merge per the current
sprint's coordination). This prompt does ONE integration pass: open a pull
request per green branch, let the required `gate` CI check approve it, merge
with `gh pr merge --squash --delete-branch`, and update coordination state.

`main` is protected: it accepts changes only through a PR whose required
`gate` check is green. Never push to `main` directly; never merge with
`--admin` or any force/override. The bypass habit is what this flow retires.

PLAN.md §2 source-of-truth: local gate output > current prompt >
PLAN.md / CRM-CONTRACT.md > SUMMARY/BLOCKERS > docs/decisions.md.

============================================================
PHASE 0 — INVENTORY
============================================================

From the single-agent root worktree with main checked out
(`C:\dev\salesforce-lite-crm`):

  git fetch --all
  git worktree list
  git branch -r --sort=-committerdate | head -20

For each candidate agent branch:
  git log --oneline main..<branch>
  git diff main...<branch> --stat
  cat <agent worktree>/SUMMARY.<agent>.md
  cat <agent worktree>/BLOCKERS.<agent>.md

A branch is merge-eligible only when ALL of the following hold:
  - It is the latest commit on the agent's branch (no newer work pending).
  - Its latest SUMMARY shows Gate status: PASS and DoD self-check: PASS.
  - Its BLOCKERS has no active `gate` or `contract` blocker.
  - For parallel-mode agent branches, its diff against main respects PLAN.md
    §5 ownership: it does not touch zones outside the owning agent's zone
    except for documented §10 cross-zone exceptions visible in its SUMMARY.
    For single-agent root branches, repo-wide edits are coherent and tied to
    the prompt.
  - It does not introduce permanent §4 non-goals as features.

Reject (do NOT merge) branches with:
  - Red gates or active `gate` blockers.
  - Parallel-mode ownership violations not documented per §10.
  - Behind main by >5 commits (agent must rebase first via their LOOP.md).

============================================================
PHASE 1 — MERGE ORDER
============================================================

Determine merge order by integration risk, lowest first:
  1. Codex (lib/server, routing, forecast, seed) — typically first if
     changed, as it owns the foundational logic.
  2. Claude (app/**) — second.
  3. Grok (components/**, globals.css, tailwind) — third.
  4. Gemini (tests/**, e2e/**, scripts/**) — last; it validates the
     others.

Override the default order if the diffs make a different sequencing
clearly safer (e.g., if Gemini's test diff is required to validate
Codex's logic diff, merge Gemini first against a snapshot of Codex's
branch).

============================================================
PHASE 2 — OPEN A PR PER BRANCH, MERGE VIA THE GATE
============================================================

For each branch in order:
  git push origin <branch>                         # publish the branch
  gh pr create --base main --head <branch> --fill  # or --title/--body
  gh pr checks <branch> --watch                    # wait for required `gate`

  If `gate` is green:
    gh pr merge <branch> --squash --delete-branch  # NO --admin, NO force

  If `gate` is red:
    Leave the PR open. File a `gate` blocker (PLAN.md §10) against the owning
    agent with the failing check name and the PR/run link. Move on to the next
    branch. Do NOT bypass, do NOT `--admin`, do NOT push to `main`.

Conflicts (GitHub marks the PR "not mergeable" / needs rebase):
  - Owning agent's zone: the owning agent rebases on their branch via
    LOOP.md and re-pushes; `gate` re-runs automatically on the PR.
  - Shared coordination zone (PLAN.md §5): resolve on the branch preserving
    §17 latest decisions and the higher-version document, then re-push.
  - Another agent's zone: do NOT resolve. File an `ownership` blocker on the
    offending agent with the conflict paths and skip that branch.

Per PLAN.md §7 hard rules: no direct push to `main`, no `--admin`/force merge,
no `git push --force`, no amending pushed commits, no rebasing `main`.

============================================================
PHASE 3 — VERIFY THE GATE (per PR, on CI)
============================================================

The required `gate` check (lint + typecheck + test + build) runs on CI for
each PR and IS the merge gate — the same deterministic sequence as the local
gate minus the advisory `e2e` job (`continue-on-error`, non-blocking; tracked
in TICKET008). A PR merges only when `gate` is green.

Optionally run the full local §9 sequence (incl. e2e) on the branch BEFORE
opening the PR to catch issues early:
  npm install
  if (-not (Test-Path .env)) { Copy-Item .env.example .env }
  npx prisma generate
  npx prisma db push
  npm run seed
  npm run lint
  npm run typecheck
  npm run test
  npm run build
  npx playwright install chromium
  npm run test:e2e
The CI `gate` is authoritative for the merge decision.

If a PR's `gate` is red:
  - Read the failing CI step in `gh pr checks <branch>` / the run log.
  - The owning agent fixes on their branch via LOOP.md and re-pushes; the PR
    re-runs `gate` automatically.
  - File a `gate` blocker (§10) if it cannot be fixed this pass.
  - Do NOT merge, do NOT `--admin`, do NOT push to `main` to "fix it on main".

============================================================
PHASE 4 — UPDATE COORDINATION DOCS
============================================================

If documentation drift surfaced during the merge (e.g., README claims a
route that the merged code didn't ship, PLAN.md status doesn't reflect
the merge), make a single `docs(merge):` commit fixing the smallest
documented drift — on its own short-lived branch, integrated through the
same gated PR flow (Phase 2). Never push it straight to `main`.

Do NOT rewrite agent SUMMARY/BLOCKERS files here — owning agents update
their own files in their next LOOP.md iteration.

============================================================
FINAL CHAT OUTPUT
============================================================

  STATUS:    <GREEN | RED>
  MERGED:    <list of branches merged>
  REJECTED:  <list of branches rejected, with reasons>
  GATE:      <PASS | FAIL — revert sha if FAIL>
  NEXT:      <integration complete | <agent> retry needed | further merges>
  STOPPED:   <reason>

============================================================
GO
============================================================

Begin Phase 0 now.
