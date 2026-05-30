# TICKET012 — synchronize gate/docs command signatures

- **Status:** Done (2026-05-29)
- **Priority:** Medium

## Goal

Eliminate command drift by aligning docs and scripts around the actual repository
scripts (`npm run test`, `agent:*` helpers), and remove stale or contradictory
status lines.

## Context

`README.md`, `docs/LOCAL-GATE.md`, and `docs/ai/REPO_MAP.md` carried stale test
and helper signatures. This ticket captures one-scope cleanup with checklists and
evidence for future agents.

## Scope

- In: `README.md`, `docs/LOCAL-GATE.md`, `docs/ai/REPO_MAP.md`.
- Out: test behavior, CI jobs, package scripts.

## Likely files

`README.md`, `docs/LOCAL-GATE.md`, `docs/ai/REPO_MAP.md`.

## Steps

1. Confirm authoritative `npm run` command surface.
2. Replace stale `vitest --maxWorkers` references with current script signature.
3. Ensure docs reference formatting check behavior and AFK check alias locations.
4. Verify no contradictory command text remains between files.

## Acceptance criteria

- [x] `test` command signatures match `package.json`.
- [x] `agent:format` behavior described consistently.
- [x] Non-technical agent instructions no longer contain contradictory gate text.
- [x] No unrelated files edited.

## Commands

```powershell
rg -n "maxWorkers|agent:check|agent:format|npm run test" README.md docs/LOCAL-GATE.md docs/ai/REPO_MAP.md
```

## Risks

Low risk; this is strict doc/process alignment with no runtime behavior changes.
