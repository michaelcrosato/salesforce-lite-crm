# Project Control

## Current Status

- Branch observed this pass: `codex/sprint-4-demo-seed-tuning`.
- Current pass: Codex repo hygiene continuation active under the current
  max-YOLO prompt; full local gate passed on 2026-05-19.
- Product feature work: not expanded. This pass only corrected contract drift,
  stale coordination docs, excluded-route behavior, and non-contract seed/helper
  artifacts.
- Contract: `CRM-CONTRACT.md` v2.0 remains the source of truth for entity names,
  statuses, routes, and adapter signatures.
- Max-YOLO policy: the current prompt can authorize one-run exceptions. Use
  repo-local evidence, SUMMARY/BLOCKERS, and the local gate instead of manual
  approval gates.

## Worktree Note

The prompt named `C:\dev\salesforce-lite-crm-codex`, but that path was not a
Git repository and contained only ignored `.next` output at the start of this
pass. The active Codex worktree for this pass is:

```text
C:/dev/salesforce-lite-crm bac8264 [codex/sprint-4-demo-seed-tuning]
```

The readiness pass therefore ran against `C:\dev\salesforce-lite-crm`, which is
also the Codex worktree path listed in `PLAN.md` and `AGENTS.md`.

As of `scripts/check-worktrees.ps1` on 2026-05-19, all four expected worktrees
are registered:

```text
C:/dev/salesforce-lite-crm        bac8264 [codex/sprint-4-demo-seed-tuning]
C:/dev/salesforce-lite-crm-claude 75d6a28 [claude/autonomy]
C:/dev/salesforce-lite-crm-gemini 32a7385 [gemini/autonomy]
C:/dev/salesforce-lite-crm-grok   3c604a4 [grok/sprint-4-component-polish]
```

Claude and Gemini have local dirty generated/debug files in their worktrees;
do not dispatch unattended work there until those paths are cleaned or
explicitly accounted for in that agent's reports.

## Completed Readiness Scope

This pass verified the route and documentation contract, then made narrow
cleanup changes:

- Disabled the excluded command-palette UI surface while preserving top search
  as contacts-only.
- Removed non-contract dealer trophy/hype/prophecy helper code, tests, and seed
  rows.
- Updated stale worktree, route, prompt, demo, backlog, and report
  documentation.
- Preserved `/deals?deal=<id>` as the only live opportunity detail behavior.
- Confirmed `/tasks`, `/cases`, `/campaigns`, and `/reports` are live routes.

## Sprint Status From PLAN.md

`PLAN.md` marks the readiness pass active by current prompt and Sprint 4 queued:

| Feature | Owner | Status |
|---|---|---|
| S4-F1 Demo seed tuning | Codex | queued |
| S4-F2 Route visual QA | Claude | queued |
| S4-F3 Component polish | Grok | queued |
| S4-F4 Demo smoke and gate hardening | Gemini | queued |

## Prepared Next Feature List

`docs/NEXT-PROMPTS.md` and `prompts/shared/s4-f*.md` are the active next-push
prompt artifacts. Older `*-SPRINT-4B.md` prompt files are historical and marked
as superseded.

## Chat Versus Repo

Chat is for current prompts, one-run exceptions, and short coordination context.
Repo docs are for durable rules, contracts, checklists, scripts, and prompts.
Do not paste raw chat history into repo files.

## PLAN.md Versus README.md Versus CRM-CONTRACT.md

- `PLAN.md`: execution protocol, sprint scope, source-of-truth hierarchy, gate,
  ownership, reports.
- `README.md`: product overview, AI-agent read-first list, local run
  instructions, implemented routes/workflows, database notes, tests,
  limitations, and roadmap.
- `CRM-CONTRACT.md`: entity names, statuses, routes, adapter signatures.
- `AGENTS.md`: short operational handoff for CLI agents.

## Exact Next Step

Continue Sprint 4 coordination from `docs/NEXT-PROMPTS.md`. Before launching
non-Codex agents, inspect their current worktree status with
`scripts/check-worktrees.ps1`; the full local gate passed in the Codex worktree
on 2026-05-19.
