# Project Control

## Current Status

- Branch: `feat/codex-crm-contract-api`
- Current pass: repo readiness and coordination scaffold.
- Product feature work: paused for this pass.
- Contract: `CRM-CONTRACT.md` exists on this branch and is the source of truth for entity names, statuses, routes, and adapter signatures.
- Max-YOLO policy: the current prompt can authorize one-run exceptions. Use repo-local evidence, SUMMARY/BLOCKERS, and the local gate instead of manual approval gates.

## Active Scope

This readiness pass may update:

- `PLAN.md`, `README.md`, `AGENTS.md`
- `docs/**`
- `prompts/**`
- `scripts/*.ps1`
- root-level `SUMMARY.*.md` and `BLOCKERS.*.md`
- `.gitignore` only for local/generated artifact coverage

This pass must not build product features, change product behavior, or expand scope.

## Sprint Status From PLAN.md

`PLAN.md` marks the readiness pass active by current prompt and Sprint 4 queued:

| Feature | Owner | Status |
|---|---|---|
| S4-F1 Demo seed tuning | Codex | queued |
| S4-F2 Route visual QA | Claude | queued |
| S4-F3 Component polish | Grok | queued |
| S4-F4 Demo smoke and gate hardening | Gemini | queued |

## Planned Next Feature List

Pending. `docs/NEXT-PROMPTS.md` contains placeholders only. Do not invent the next feature prompts in this pass.

## Branch And Worktree Topology

Observed with `git worktree list` during the readiness pass:

```text
C:/dev/salesforce-lite-crm        b3c6ffd [feat/codex-crm-contract-api]
C:/dev/salesforce-lite-crm-claude 54965da [feat/claude-crm-ui-e2e]
C:/dev/salesforce-lite-crm-grok   b5c7cd9 [feat/grok-crm-data-reports]
```

Expected but missing locally:

```text
C:/dev/salesforce-lite-crm-gemini [gemini branch pending]
```

Use `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1` before creating or repairing worktrees.

## Chat Versus Repo

Chat is for current prompts, one-run exceptions, and short coordination context.
Repo docs are for durable rules, contracts, checklists, scripts, and prompts.
Do not paste raw chat history into repo files.

## PLAN.md Versus README.md Versus CRM-CONTRACT.md

- `PLAN.md`: execution protocol, sprint scope, source-of-truth hierarchy, gate, ownership, reports.
- `README.md`: product overview, local run instructions, demo path, verified limitations.
- `CRM-CONTRACT.md`: entity names, statuses, routes, adapter signatures.
- `AGENTS.md`: short operational handoff for CLI agents.

## Exact Next Step

After this readiness pass lands, review `SUMMARY.codex.md` and `BLOCKERS.codex.md`, then fill `docs/NEXT-PROMPTS.md` or `prompts/shared/` with the next agent setup prompts.
