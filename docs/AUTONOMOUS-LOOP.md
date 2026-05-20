# Autonomous Loop Executor

`scripts/run-autonomous-loop.ps1` is the R8 bounded executor for Track A code
development work. It is not CRM product runtime, does not run in the app, and
does not merge branches or approve IFT decisions.

## Purpose

The executor walks the four configured agent worktrees, snapshots each scoped
Sprint 4 prompt outside the repo, launches the operator-provided agent CLI
command with bounded timeouts, and rewrites external status files for quick
inspection.

It defaults to dry-run behavior unless `-Launch` is passed.

## Prerequisites

Before using the executor on a live loop:

- Run `scripts/archive-current-head.ps1` if you need a safety archive.
- Run `scripts/check-worktrees.ps1` and confirm expected worktrees exist.
- Run `scripts/local-gate.ps1` or the current PLAN.md gate on the baseline.
- Set provider spend caps and alert thresholds in the provider consoles.
- Use a dedicated always-on host or VM that will not sleep.
- Keep real secrets out of agent worktrees where possible.

## Required Environment Variables

Each agent command is supplied by an environment variable. The value must be a
complete PowerShell pipeline string using the literal placeholders
`{WORKTREE}` and `{PROMPT_FILE}`. The executor replaces those tokens with the
agent worktree path and the per-launch prompt snapshot path.

Required variables:

- `AUTONOMY_CODEX_CMD`
- `AUTONOMY_CLAUDE_CMD`
- `AUTONOMY_GROK_CMD`
- `AUTONOMY_GEMINI_CMD`

Safe Codex template:

```powershell
$env:AUTONOMY_CODEX_CMD = 'Get-Content -Raw "{PROMPT_FILE}" | codex exec --sandbox workspace-write --ask-for-approval never --cd "{WORKTREE}" -'
```

Literal Codex YOLO template, only inside a dedicated isolated runner:

```powershell
$env:AUTONOMY_CODEX_CMD = 'Get-Content -Raw "{PROMPT_FILE}" | codex exec --yolo --cd "{WORKTREE}" -'
```

Unset variables are skipped with `status=cli-not-configured`.

## Usage

Dry-run is the default:

```powershell
.\scripts\run-autonomous-loop.ps1 -Once -DryRun
```

One live cycle:

```powershell
.\scripts\run-autonomous-loop.ps1 -Once -Launch
```

Long-running loop with remote STOP polling:

```powershell
.\scripts\run-autonomous-loop.ps1 -Launch -EnableRemoteStop
```

Useful bounds:

- `-HardTimeoutSeconds` defaults to `7200`.
- `-HeartbeatTimeoutSeconds` defaults to `1200`.
- `-LoopIntervalSeconds` defaults to `900`.
- Timeout handling uses `taskkill.exe /T /F /PID` to terminate the wrapper and
  child agent process tree.

## STOP Controls

Local STOP: create a file named `STOP` in the repo root. The executor exits
before launching another cycle.

Remote STOP: pass `-EnableRemoteStop`. The executor fetches `origin` and exits
if `origin/main:STOP` exists. This is opt-in so normal local loops do not pay
the fetch cost.

Agents also check the local `STOP` file per PLAN.md. Agents do not poll remote
STOP themselves.

## Logs, Status, And Prompt Snapshots

Runtime state is external by default:

- Logs: `C:\dev\salesforce-lite-agent-runs\logs\`
- Status: `C:\dev\salesforce-lite-agent-runs\status\`
- Prompt snapshots: `C:\dev\salesforce-lite-agent-runs\prompts\`

The executor writes:

- `status\latest.json`
- `status\latest.md`
- one stdout/stderr log pair per launched agent
- one prompt snapshot per launch with the standard Track A invocation prepended

Do not commit generated runtime state. Repo-local `agent-runs/` and `status/`
are ignored for operators who intentionally redirect state under the repo.

## Serialization And Branch Checks

If any queued prompt references a PLAN.md section 5 shared/contract or
planning/decision file, the executor serializes the cycle and runs one agent.
Default to serialization for ambiguous shared-zone work.

Before launch, each worktree must be clean, must not be on `main`, and must use
the expected branch prefix: `codex/`, `claude/`, `grok/`, or `gemini/`.

## Merge And IFT Policy

The executor launches bounded worker prompts and records status. It does not
merge branches, push to `main`, decide merge order, or finalize IFT output.

Morning merges remain human-operated through the documented merge workflow and
the local gate. IFT remains a human judgment checkpoint and must not be
automated by this executor.

## Security Notes

Use `--yolo` only inside a locked-down isolated runner. Prefer sandboxed CLI
templates for routine overnight work. Limit network and filesystem access at
the host level where possible, and avoid placing production secrets in the
worktrees used by autonomous agents.
