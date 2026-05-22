# Next Prompts

Status: no active next-feature prompt is selected by this file.

The detailed Sprint 4B prompt set that previously lived here has been consumed
by the current `main` tree. Do not treat older Sprint 4B instructions in
`prompts/<agent>/` or agent handoff files as current dispatch unless a fresh
operator prompt explicitly reissues them.

## Current Dispatch Rules

New prompts should be generated from:

- `PLAN.md`
- `CRM-CONTRACT.md`
- `README.md`
- `DEMO.md`
- `docs/FEATURE-BACKLOG.md`
- `docs/LOCAL-GATE.md`
- Current `git status --short`
- Current `git worktree list`

New prompt files should include:

- target branch and worktree path
- execution topology: single-agent root mode or parallel worktree mode
- files or zones in scope
- exact package or gate commands to run
- report files to update
- explicit one-run exceptions, if any
- deferred scope that must not be bundled

Use `C:\dev\salesforce-lite-crm` when one agent should solve a coherent
repo-wide problem without ownership-zone handoffs. Use agent-specific worktrees
only when the work is intentionally parallel and ownership zones should be
enforced.

## Deferred Scope To Keep Out Unless Re-Promoted

- Authentication, permissions, and multi-tenancy.
- Deployment configuration.
- Salesforce integration.
- External AI provider integration.
- Dedicated `/search` page.
- Dealer order create/edit flows.
- Area create/edit flows.
- `/deals/[id]` detail route.
- Postgres as the default runtime.
- Persistent forecast scenarios.
- CSV UI workflow.
- Lead to Account + Contact + Opportunity conversion.

## Review Prompt Inputs

Use these inputs for the next readiness or merge review:

- `PLAN.md`
- `CRM-CONTRACT.md`
- `README.md`
- `DEMO.md`
- `docs/PROJECT-CONTROL.md`
- `docs/MERGE-PLAYBOOK.md`
- `docs/LOCAL-GATE.md`
- `docs/FEATURE-BACKLOG.md`
- Each relevant agent's latest `SUMMARY.<agent>.md`
- Each relevant agent's latest `BLOCKERS.<agent>.md`

Review goals:

- Confirm the requested work stays within `PLAN.md` and `CRM-CONTRACT.md`.
- Confirm no branch introduces deferred scope.
- Compare gate results and unresolved blockers before merge planning.
- Recommend a merge order only when supported by repo-local evidence and local
  gate output.
