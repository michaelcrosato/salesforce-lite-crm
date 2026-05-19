# MERGE.md — integrate green agent branches into main

You are the operator (or whichever agent owns the merge per the current
sprint's coordination). This prompt does ONE integration pass: merge
green branches into main, run the full §9 gate on main, update
coordination state.

PLAN.md §2 source-of-truth: local gate output > current prompt >
PLAN.md / CRM-CONTRACT.md > SUMMARY/BLOCKERS > docs/decisions.md.

============================================================
PHASE 0 — INVENTORY
============================================================

From a worktree with main checked out (typically codex's worktree at
C:\dev\salesforce-lite-crm):

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
  - Its diff against main respects PLAN.md §5 ownership: it does not
    touch zones outside the owning agent's zone except for documented
    §10 cross-zone exceptions visible in its SUMMARY.
  - It does not introduce permanent §4 non-goals as features.

Reject (do NOT merge) branches with:
  - Red gates or active `gate` blockers.
  - Ownership violations not documented per §10.
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
PHASE 2 — MERGE EACH BRANCH
============================================================

For each branch in order:
  git checkout main
  git pull --ff-only
  git merge --no-ff <branch> -m "merge: <branch> — <one-line summary>"
  git status

Conflicts handling:
  - Conflicts in the owning agent's zone: resolve preserving the agent's
    intent (the agent's HEAD wins).
  - Conflicts in shared coordination zone (PLAN.md §5): resolve
    preserving §17 latest decisions and the higher-version document.
  - Conflicts in another agent's zone: `git merge --abort` immediately,
    file an `ownership` blocker on the offending agent with the conflict
    paths, continue with other branches.

Per PLAN.md §7 hard rules: no force-push to main, no `git push --force`,
no amending pushed commits, no rebasing main.

============================================================
PHASE 3 — RUN FULL §9 GATE ON MAIN
============================================================

After all intended merges:
  npm install
  if (-not (Test-Path .env)) { Copy-Item .env.example .env }
  npx prisma generate
  npx prisma db push
  npm run seed
  npm run test
  npm run build
  npx playwright install chromium
  npm run test:e2e

If green:
  git push origin main
  Continue to Phase 4.

If red:
  - Identify which merge introduced the failure. Use `git bisect` on the
    merge commits if not obvious from output.
  - Revert the offending merge: `git revert -m 1 <merge-sha>`.
  - Push the revert.
  - File a `gate` blocker against the responsible agent in their
    BLOCKERS.<agent>.md (you may edit another agent's BLOCKERS file
    when filing a cross-agent blocker; document the cross-zone reason).
    [NOTE — operator: see UNRESOLVED CLAIMS in chat for the suggested
    correction to this bullet, which makes blocker filing zone-clean.]
  - Do NOT attempt to fix the issue in main; the agent fixes in their
    branch via LOOP.md and re-attempts merge next cycle.

============================================================
PHASE 4 — UPDATE COORDINATION DOCS
============================================================

If documentation drift surfaced during the merge (e.g., README claims a
route that the merged code didn't ship, PLAN.md status doesn't reflect
the merge), commit a single `docs(merge):` commit fixing the smallest
documented drift.

Do NOT rewrite agent SUMMARY/BLOCKERS files here — owning agents update
their own files in their next LOOP.md iteration.

Push.

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