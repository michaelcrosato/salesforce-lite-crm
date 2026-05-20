# Agent Loop Operations

## Purpose

Long-running agent loops should maximize useful progress while preserving the repo contract: explore, plan, implement, validate, repair, commit, report, push, repeat.

The runner is the control system. The implementation brain is the repo-local prompt (`prompts/<agent>/LOOP.md`) plus the current worktree state.

## Source of truth

When sources disagree, use this order:

1. Actual local gate output from `scripts/local-gate.ps1`
2. Current operator prompt
3. `PLAN.md` and `CRM-CONTRACT.md`
4. `AGENTS.md`
5. `docs/LOCAL-GATE.md`, `docs/PROJECT-CONTROL.md`, `docs/NEXT-PROMPTS.md`, `docs/FEATURE-BACKLOG.md`
6. `prompts/<agent>/LOOP.md`
7. `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`

Do not invent `npm run validate`. The current full gate is `scripts/local-gate.ps1`.

## Standard unattended loop

1. Confirm correct worktree, branch, and STOP/AUTONOMY.STOP state.
2. Refuse main-branch feature work unless explicit control/merge mode is supplied.
3. Create an agent-owned branch automatically when started on `main` and branch creation is allowed.
4. Capture git status, HEAD, recent commits, package scripts, and worktree coordination output.
5. Feed `prompts/<agent>/LOOP.md` to the agent with full-autonomy runner context.
6. Run `scripts/local-gate.ps1` after each iteration.
7. If red, launch bounded repair prompts with the gate tail and dirty state.
8. If green but dirty, launch cleanup/commit prompt; do not let the runner blindly commit files.
9. Push only clean green non-main branches when `-Push` is supplied.
10. Stop on unrepaired red gate, unresolved dirty tree, STOP/AUTONOMY.STOP, merge-ready state, sprint rollover without rollover authorization, wrong branch/worktree, or contract/safety boundary.

## Validation

Use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1
```

The current gate runs install, env bootstrap, Prisma generate/db push, seed, lint, typecheck, Vitest, build, Playwright Chromium install, and e2e.

## Commit rule

Agents own commits. The runner must not blindly run `git add .` or `git add -A`.

Expected commit pattern:

1. Scoped implementation commit(s).
2. Separate report-only commit for `SUMMARY.<agent>.md` and `BLOCKERS.<agent>.md`.
3. Push after clean green gate only when requested.

## Log rule

Runner logs go under:

```text
agent-runs/<agent>/<yyyyMMdd-HHmmss>/
```

The current `.gitignore` already ignores `agent-runs/`.

## Overnight mode

Use the watchdog launcher when the machine is isolated/trusted and human review
will happen later. It is safe to invoke from any PowerShell working directory
because all git, stop-file, and runner paths are rooted at `-RepoRoot`.

```powershell
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass `
  -File C:\dev\salesforce-lite-crm\scripts\start-codex-overnight.ps1
```

The launcher runs a Codex exec smoke test, creates/pushes a rollback tag, then
starts `scripts\autonomy-loop.ps1` with full overnight defaults:
`-MaxIterations 0`, `-FullYolo`, `-KeepAwake`, `-BaselineGate`,
`-InstallBrowsers`, `-StartDockerServices`, `-AutoRevertBroken`,
`-AllowSprintRollover`, and `-Push`. It restarts the inner loop after exit
unless `STOP` or `AUTONOMY.STOP` exists under the repo root.

If the inner loop exits non-zero, the watchdog stays in continuous mode by
default: it logs the failure, re-runs the Codex invocation smoke, waits briefly,
and starts the inner loop again. Because the inner loop runs with
`-BaselineGate`, a red repo state enters the repair prompt path before new work.
Use `-StopOnLoopFailure` or `-StopOnCodexSmokeFailure` only when deliberately
debugging the launcher itself.

`-MaxIterations 0` means no artificial iteration cap. Stop conditions still
apply.

If you need to reuse a specific rollback tag:

```powershell
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass `
  -File C:\dev\salesforce-lite-crm\scripts\start-codex-overnight.ps1 `
  -RollbackTag safe-before-yolo-20260519-225620
```

## Workday mode

Use a shorter run when human review is nearby:

```powershell
cd C:\dev\salesforce-lite-crm
powershell -ExecutionPolicy Bypass -File scripts\autonomy-loop.ps1 `
  -RunRoot "C:\dev\salesforce-lite-crm" `
  -MaxIterations 3 `
  -RepairAttemptsPerIteration 2 `
  -FullYolo `
  -KeepAwake
```

## Morning check

```powershell
cd C:\dev\salesforce-lite-crm
powershell -ExecutionPolicy Bypass -File scripts\morning-check.ps1 -RunGate
```

Review `agent-runs/<agent>/<latest>/TRANSCRIPT.*.log`, `MASTER.log`, `SUMMARY.<agent>.md`, `BLOCKERS.<agent>.md`, `git log --oneline -20`, and `git status --short` before merging.

## Safety boundaries that remain in max automation

Allowed without routine approval in repo-local autonomy:

```text
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
git status / log / diff
git add scoped files
git commit
git push origin HEAD on non-main branches
```

Still blocked unless explicitly requested for the current run:

```text
force push
history rewrite
main-branch feature work
deleting worktrees
generic recursive deletion of source paths
destructive production database operations
secrets exposure
production operations
live external integrations
bypassing CRM-CONTRACT.md
creating /deals/[id]
adding auth, deployment, Salesforce integration, external AI, or deferred product routes without PLAN promotion
```
