# Prompts

Prompts in this directory are versioned repo artifacts for planned agent work.
They should be concise, scoped, and aligned with `PLAN.md` and
`CRM-CONTRACT.md`.

Prompt files should include:

- target branch and worktree path
- files or zones in scope
- gate commands to run
- report files to update
- explicit one-run exceptions, if any

Prompt files should not:

- claim tests, builds, or e2e passed before they were run
- paste raw chat history
- override `PLAN.md` silently
- invent product scope

Current next-push prompts live in `docs/NEXT-PROMPTS.md` and
`prompts/shared/s4-f*.md`.

Older `*-SPRINT-4B.md` prompt files are historical artifacts from a prior
parallel-agent run. They are retained for provenance only and are superseded by
`PLAN.md`, `CRM-CONTRACT.md`, `docs/NEXT-PROMPTS.md`, and the shared Sprint 4
prompt files.
