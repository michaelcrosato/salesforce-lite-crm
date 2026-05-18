# Worktree Setup

## Expected Paths

Defined by `PLAN.md`:

```text
C:\dev\salesforce-lite-crm
C:\dev\salesforce-lite-crm-claude
C:\dev\salesforce-lite-crm-grok
C:\dev\salesforce-lite-crm-gemini
```

Observed during this readiness pass after Gemini bootstrap:

```text
C:/dev/salesforce-lite-crm        [chore/claude-hooks-r23]
C:/dev/salesforce-lite-crm-claude [feat/claude-crm-ui-e2e]
C:/dev/salesforce-lite-crm-gemini [gemini/sprint-4-demo-smoke-gate-hardening]
C:/dev/salesforce-lite-crm-grok   [feat/grok-crm-data-reports]
```

Use `git worktree list` for the current commit SHA at each path.

## Inspect Worktrees

```powershell
git worktree list
scripts/check-worktrees.ps1
```

## Create Missing Worktrees Safely

Use `scripts/create-worktrees.ps1` only when branch names are defined by
`PLAN.md` or passed explicitly as arguments. The script never overwrites an
existing path.

Example:

```powershell
scripts/create-worktrees.ps1 `
  -BaseBranch main `
  -GeminiBranch gemini/sprint-4-demo-smoke-gate-hardening
```

The helper prints the git commands before running them.

## Rebase From Inside A Worktree

Only rebase when the current prompt or branch workflow calls for it.

```powershell
Set-Location C:\dev\salesforce-lite-crm-claude
git fetch origin
git rebase origin/main
```

Repeat from the specific worktree you intend to update. Running rebase from
`C:\Users\...` or another non-repo directory fails because it is not a git
repository.

## Remove Or Recreate A Worktree Safely

Inspect first:

```powershell
git worktree list
git -C C:\dev\salesforce-lite-crm-gemini status --short
```

Only remove a worktree after its branch state and uncommitted files are known:

```powershell
git worktree remove C:\dev\salesforce-lite-crm-gemini
```

Never delete worktree directories with generic recursive filesystem commands.
