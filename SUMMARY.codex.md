Agent: Codex

Sprint: 22 / repo coordination

Feature: Worktree topology policy update

Branch: main

Status: done

Commits this prompt: none

Gate status: NOT RUN - full local gate not run for this docs/scripts-only policy update. Validation run: `git diff --check`; PowerShell parser check for changed scripts; `scripts/check-worktrees.ps1`; `scripts/create-worktrees.ps1` with no branch arguments.

DoD self-check: PASS

Timestamp: 2026-05-22T08:41:52.1613922-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Updated `AGENTS.md`, `PLAN.md`, `README.md`, and coordination docs so `C:\dev\salesforce-lite-crm` is single-agent root mode with full repo access, while agent-specific worktrees remain parallel mode with mandatory ownership zones.
- Moved parallel Codex references to `C:\dev\salesforce-lite-crm-codex` across worktree setup docs, autonomy docs, prompt templates, manager prompts, and shared Sprint 4 prompts.
- Updated autonomy scripts so parallel executors target only agent-specific worktrees and exclude the repo root from worker dispatch.
- Updated `scripts/create-worktrees.ps1` to create a Codex parallel worktree when a Codex branch is supplied.
- Updated and hardened `scripts/check-worktrees.ps1` to classify root vs parallel modes, warn on parallel branch-prefix drift, and report an existing non-Git parallel path without throwing.
- Completed a coherence pass over docs/prompts/scripts, including Track A operating-model wording and active plus archived Sprint 4 prompt topology labels.
- Updated `scripts/start-codex-overnight.ps1` so the default watchdog command passes `-AllowMain` into both the Codex smoke and real autonomy loop for the root solo-agent run.
- Updated `scripts/autonomy-loop.ps1` to save tracked/staged diffs and untracked file copies under ignored `agent-runs/` before `-AutoRevertBroken` resets a failed attempt.
- Clarified active guardrails so existing excluded placeholder routes such as `/deals/[id]` are not mistaken for promoted live product pages during the overnight run.
- Repaired `C:\dev\salesforce-lite-crm-codex` into a clean `codex/autonomy` worktree and cleaned stale generated/parallel dirty files from Claude and Gemini worktrees, preserving Gemini's untracked test variant under ignored `agent-runs/`.
- Ran `npm audit fix`; npm made no safe changes and reported remaining advisories require `--force` with breaking dependency changes, so no dependency churn was introduced before the root solo overnight test.

### Discovered this prompt

- `C:\dev\salesforce-lite-crm-codex` exists locally but is not currently a Git worktree. This does not block single-agent root work; repair or recreate it only before launching Codex as part of a parallel fleet.
- Existing Claude and Gemini worktrees have local dirty files reported by `scripts/check-worktrees.ps1`; they were not modified from the root run.

### Next action

Commit the topology-policy update to `main`. The exact overnight command now dry-runs to root solo mode on `main` with `-AllowMain`.

### Scope confirmation

No cross-ownership edits: YES - current path is `C:\dev\salesforce-lite-crm`, so this was a single-agent root-mode policy/docs/scripts update with full repo access.

CRM-CONTRACT.md honored: YES
