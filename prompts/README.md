# Prompts

Prompts in this directory are versioned repo artifacts for planned agent work.
They should be concise, scoped, and aligned with `PLAN.md` and
`CRM-CONTRACT.md`.

Older prompt files are historical instructions for the branch or sprint that
created them. They may mention completed work, old blockers, or prior branch
names. Use current `PLAN.md`, `CRM-CONTRACT.md`, `docs/PROJECT-CONTROL.md`, and
repo-local evidence before treating any prompt file as active.

Prompt files should include:

- target branch and worktree path
- execution topology: `C:\dev\salesforce-lite-crm` single-agent full-repo mode
  or agent-specific parallel mode
- files or zones in scope
- gate commands to run
- report files to update
- explicit one-run exceptions, if any

Prompt files should not:

- claim tests, builds, or e2e passed before they were run
- paste raw chat history
- override `PLAN.md` silently
- invent product scope

No next feature prompts are active from this directory unless a fresh operator
prompt explicitly selects one.
