# TICKET009 — migrate the autonomous loop to PR-based merges (retire admin-bypass)

- **Status:** Open
- **Priority:** Medium
- **Depends on:** TICKET005 (prompt template consolidation) is adjacent — the
  `LOOP.md` edit here should be coordinated with it to avoid double work.

## Goal

Make the autonomous loop land changes the same legitimate way a human now does:
push a branch, open a PR, let the required `gate` check approve it, merge with
`gh pr merge --squash` — **no admin-exemption, no force**.

## Context

`main` now requires a PR with a green `gate` status check (0 human approvals;
`enforce_admins=false`). In single-agent root mode the loop currently commits to
`main` and runs `git push origin <branch>` directly (see `prompts/*/LOOP.md`
Phase 6). Because the run identity is a repo admin, that direct push still
*bypasses* the rule (the "Bypassed rule violations" warning) instead of going
through CI approval — exactly the forcing/overriding we want to stop.

This ticket closes the loop so the overnight automation stops bypassing.

## Scope

- In: update the loop's Phase 6 to: create/push a `<agent>/<feature>` branch,
  `gh pr create`, wait for the `gate` check, `gh pr merge --squash
  --delete-branch`; handle the "gate red" case by leaving the PR open and filing
  a `gate` blocker (do **not** bypass). Update `AGENTS.md` / `PLAN.md` §7 push
  rules to describe the PR flow. Update the runner scripts
  (`scripts/autonomy-loop.ps1`, `scripts/start-codex-overnight.ps1`) if they
  assume direct-to-main push.
- Out: enabling `enforce_admins=true` — do that only as the **final** step once
  the loop is proven PR-aware (otherwise direct pushes hard-fail instead of
  bypassing, breaking the loop). Track that flip as the closing acceptance item.

## Likely files

`prompts/*/LOOP.md` (Phase 6; coordinate with TICKET005's shared-template move),
`prompts/*/SPRINT-ROLLOVER.md` if it pushes, `AGENTS.md`, `PLAN.md` §7,
`scripts/autonomy-loop.ps1`, `scripts/start-codex-overnight.ps1`. Final
protection flip via `gh api`.

## Steps

1. Define the PR-merge sequence once (shared prompt template per TICKET005).
2. Update runner scripts to branch + PR + gated merge; never `--admin`.
3. Add a "gate red → open PR + blocker, stop" rule (no bypass fallback).
4. Dry-run one full loop iteration end-to-end on a throwaway feature.
5. Only then: `enforce_admins=true` to fully close direct-push bypass.

## Acceptance criteria

- [ ] A full autonomous iteration merges via PR + green `gate`, no `--admin`.
- [ ] Loop handles a red gate by stopping with a PR + blocker, not a bypass.
- [ ] Docs (`AGENTS.md`, `PLAN.md` §7) describe the PR flow as the only path.
- [ ] (Closing) `enforce_admins=true` set; verified that direct push to `main`
      is now rejected rather than bypassed.

## Commands

```powershell
gh pr create ; gh pr checks ; gh pr merge --squash --delete-branch
gh api repos/michaelcrosato/salesforce-lite-crm/branches/main/protection
```

## Risks

Flipping `enforce_admins` too early hard-blocks the loop's pushes (no bypass) and
strands iterations. Sequence it last, after the PR flow is proven.
