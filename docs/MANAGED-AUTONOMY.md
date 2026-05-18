# Managed Autonomy

R8 is the bounded executor. It knows how to snapshot prompts, launch agent CLIs,
enforce timeouts, tree-kill child processes, check STOP controls, and publish
status.

R9 is the manager wrapper. It keeps queue state, asks a manager model for
dispatch JSON, validates that JSON against repo rules, launches bounded workers
or reviewer-only prompts, records handoffs, tracks model availability, and drafts
IFT proposals for human review.

Neither layer merges branches, touches `main`, finalizes IFT, or bypasses the
local gate.

## Runtime State

DryRun is the default unless `-Launch` is passed.

Runtime state lives outside the repo under:

```text
C:\dev\salesforce-lite-agent-runs\
```

Queue state lives at:

```text
C:\dev\salesforce-lite-agent-runs\queue\autonomy-queue.json
```

The first run copies the committed example queue from
`docs/autonomy/queue.example.json` if the runtime queue does not exist.

## Modes

- `DryRun`: forced whenever `-Launch` is absent; no workers are launched.
- `FailSafe`: max 2 worker dispatches, failover enabled, IFT proposal drafting enabled.
- `MaxAutonomy`: max 4 worker dispatches, failover enabled, IFT proposal drafting enabled.
- `ReviewOnly`: reviewer-only semantics; manager dispatch is rejected unless each entry uses role `reviewer`.

Example commands:

```powershell
.\scripts\run-managed-autonomy.ps1 -Mode DryRun -Once
.\scripts\run-managed-autonomy.ps1 -Mode FailSafe -Launch -Once
.\scripts\run-managed-autonomy.ps1 -Mode FailSafe -Launch -EnableRemoteStop
```

## STOP Controls

Local STOP: create `STOP` at the repo root. The manager exits before the next
cycle.

Remote STOP: pass `-EnableRemoteStop`. The manager fetches `origin` and exits
if `origin/main:STOP` exists.

Workers still inherit the R8 local STOP rule through their prompts. The manager
does not merge or switch branches to receive remote STOP.

## Model Availability And Quota

The manager scans recent stdout/stderr logs for quota, auth, overload, rate
limit, and session-expiry phrases. When detected, it marks the model unavailable
for a cooldown period in:

```text
C:\dev\salesforce-lite-agent-runs\status\model-availability.json
```

Availability is persisted across cycles and is fed back into the dispatch
manager prompt. Expired cooldowns are cleared automatically.

## Handoffs

Timeouts, heartbeat failures, quota hits, crashes, missing CLI commands, and
post-run validation failures produce cross-model handoffs under:

```text
C:\dev\salesforce-lite-agent-runs\handoffs\
```

Recent handoffs are summarized back into the manager prompt so future dispatch
can route around repeated failures. Handoffs include changed files, optional
diff paths, stdout/stderr paths, zone violations, and the supervisor
recommendation: retry, transfer, park, review-only, or stop.

## Validation

The manager model emits JSON only. PowerShell validates that dispatch against:

- known queued or active tasks
- mode concurrency limits
- allowed preferred, fallback, or review agents
- unavailable model state
- expected worktree paths
- branch prefixes
- prompt existence
- allowed zones and gate commands from the queue
- parallel-safe zone overlap rules

After a worker exits, the manager computes changed files from the pre-run commit
to the post-run HEAD plus uncommitted status. Changed files must stay inside the
task `allowed_zones`; violations create handoffs and block or requeue the task
instead of trusting the worker output.

## Notifications

Set `AUTONOMY_NOTIFY_URL` to receive webhook notifications for quota/auth hits,
timeouts, zone violations, and generated IFT proposals. If the variable is not
set, notifications are skipped.

## IFT And Merges

IFT proposal drafting only writes raw proposals under:

```text
C:\dev\salesforce-lite-agent-runs\ift-proposals\
```

Human approval remains required for IFT decisions and all merges. R9 never
finalizes IFT, applies a proposed plan, merges agent branches, or marks a merge
safe. The local gate remains authoritative.

## Provider Caveats

- Codex: supports non-interactive stdin prompts through `codex exec`; use
  `--yolo` only inside an isolated runner.
- Claude: verify the installed Claude Code print-mode command locally before
  setting autonomy environment variables.
- Gemini: verify cached Google authentication and the installed CLI syntax
  locally before live runs.
- Grok: verify the exact headless Grok command locally; keep placeholders
  `{PROMPT_FILE}`, `{WORKTREE}`, and `{OUTPUT_FILE}` where the manager expects
  substitutions.
- Meta: no configured Track A CLI is assumed by this repo; use Meta only in
  human-run IFT unless a future prompt adds a verified local CLI path.

Provider quota strings and CLI flags change. Do not claim a provider setup is
verified unless it was observed on the operator machine.
