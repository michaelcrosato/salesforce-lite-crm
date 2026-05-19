# Project Control

## Current Status

- Branch observed this pass: `gemini/autonomy`
- Current pass: autonomy repo readiness pass.
- Product feature work: not changed during this pass.
- README status: `README.md` now reflects the updated product vision for a
  full-fledged, AI-adaptive Salesforce-style CRM that autonomous AI coding
  agents can customize for small business requirements.
- Contract: `CRM-CONTRACT.md` exists on this branch and remains the source of
  truth for entity names, statuses, routes, and adapter signatures.
- Max-YOLO policy: the current prompt can authorize one-run exceptions. Use
  repo-local evidence, SUMMARY/BLOCKERS, and the local gate instead of manual
  approval gates.

## Completed Readiness Scope

This readiness/documentation pass updated durable project documentation only:

- `README.md` product positioning and local operating instructions.
- `docs/PROJECT-CONTROL.md` readiness status.
- `docs/NEXT-PROMPTS.md` Sprint 4 prompt preparation.

No product routes, data models, business logic, UI behavior, tests, package
scripts, or dependencies were added by this documentation pass.

## Sprint Status From PLAN.md

`PLAN.md` marks the readiness pass active by current prompt and Sprint 4 queued:

| Feature | Owner | Status |
|---|---|---|
| S4-F1 Demo seed tuning | Codex | queued |
| S4-F2 Route visual QA | Claude | queued |
| S4-F3 Component polish | Grok | queued |
| S4-F4 Demo smoke and gate hardening | Gemini | queued |

## Prepared Next Feature List

`docs/NEXT-PROMPTS.md` is prepared for Sprint 4 and notes that `README.md` was
updated during this pass. The prompts remain aligned with `PLAN.md` and
`CRM-CONTRACT.md` and do not authorize new product scope beyond the queued
Sprint 4 work.

## Branch And Worktree Topology

Observed with `git worktree list` during the readiness pass:

```text
C:/dev/salesforce-lite-crm        5b4e0a7 [chore/claude-hooks-r23]
C:/dev/salesforce-lite-crm-claude 54965da [feat/claude-crm-ui-e2e]
C:/dev/salesforce-lite-crm-grok   b5c7cd9 [feat/grok-crm-data-reports]
C:/dev/salesforce-lite-crm-gemini 8c44685 [gemini/autonomy]
```

Expected but missing locally:

```text
none
```

Use `docs/WORKTREE-SETUP.md` and `scripts/check-worktrees.ps1` before creating
or repairing worktrees.

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

Start Sprint 4 using `docs/NEXT-PROMPTS.md`, then verify each branch with the
appropriate local gate from `docs/LOCAL-GATE.md` before merge.
