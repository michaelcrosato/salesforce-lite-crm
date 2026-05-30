# TICKET010 — AFK readiness docs and pointer alignment

- **Status:** Done (2026-05-29)
- **Priority:** High

## Goal

Align the AFK onboarding docs so every agent can initialize in one run without
manual archaeology: roadmap, read map, ignore policy, and tool pointers.

## Context

The repo had scattered guidance across `GOAL.md`, `AGENTS.md`, `README.md`,
`docs/ai/REPO_MAP.md`, and `docs/ROADMAP.md` with duplicated or stale details.
This run adds a canonical AFK `ROADMAP.md`, updates core docs, and points
`CLAUDE.md` + `.cursor/rules` to the main control flow.

## Scope

- In: canonical doc updates and pointer synchronization:
  `GOAL.md`, `AGENTS.md`, `ROADMAP.md`, `README.md`,
  `docs/ai/REPO_MAP.md`, `docs/PROJECT-CONTROL.md`, `docs/LOCAL-GATE.md`,
  `.aiignore`, `CLAUDE.md`, `.cursor/rules`.
- Out: architecture changes, schema/seed edits, route logic changes.

## Likely files

`GOAL.md`, `AGENTS.md`, `ROADMAP.md`, `README.md`, `docs/ai/REPO_MAP.md`,
`docs/PROJECT-CONTROL.md`, `docs/LOCAL-GATE.md`, `.aiignore`,
`CLAUDE.md`, `.cursor/rules/max-yolo.mdc`.

## Steps

1. Audit existing onboarding/docs references for drift and contradictions.
2. Update each file to the same read-first and tool policy order.
3. Add/refresh one root AFK roadmap summary (`ROADMAP.md`) and keep `docs/ROADMAP.md`
   as feature roadmap provenance.
4. Run a diff pass and ensure no stale one-off instructions remain.

## Acceptance criteria

- [x] AFK onboarding files reference the same read-first order.
- [x] Tool policy files are thin pointers to canonical files.
- [x] `.aiignore` and script lists include current agent/repo hygiene.
- [x] `docs/PROJECT-CONTROL.md` and `docs/LOCAL-GATE.md` no longer report
  stale local state/commands.
- [x] `ROADMAP.md` exists and links to the execution plan.

## Commands

```powershell
npm run lint ; npm run typecheck ; npm run test ; npm run build
npm run agent:format
```

## Risks

None high-confidence; this ticket is documentation and process alignment only.
