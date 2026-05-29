# 015 — Consolidate duplicated agent prompt templates (TICKET005)

- **Wave:** Phase 1 — Core Upgrades
- **Status:** [ ] Todo
- **Scores:** Impact 3/5 · Feasibility 4/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none (coordinate with the already-landed PR-merge-flow doc edits)
- **Scope gate:** In-scope (docs/prompts)
- **Related:** TICKET005, `prompts/<agent>/LOOP.md` (≈4 identical copies), `prompts/**/SPRINT-ROLLOVER.md` (≈5 copies), `prompts/**/Old/` (9 stale files), `prompts/shared/`

## Description & Expected Impact
The per-agent prompt files are near-duplicates: `prompts/<agent>/LOOP.md` are ~4 byte-identical copies, `SPRINT-ROLLOVER.md` ~5 copies, plus 9 stale `prompts/**/Old/` files. Every cross-cutting prompt edit (like the recent merge-flow change) must be applied N times — error-prone and a maintenance tax. Collapse to a single shared template with `{AGENT}` substitution.

Impact: one source of truth for the loop prompts; future prompt edits touch one file, not five.

## Definition of Done & Acceptance Criteria
- [ ] A single canonical `prompts/shared/LOOP.md` (and `SPRINT-ROLLOVER.md`) with `{AGENT}` placeholders; per-agent files become thin pointers/includes or are generated.
- [ ] Stale `prompts/**/Old/` directories removed.
- [ ] No prompt content drift: the consolidated template is a superset-equal of the previous per-agent copies (diff-verified).
- [ ] All references (AGENTS.md, PLAN.md, docs) point to the shared template; `grep` finds no dangling references.
- [ ] Gate green (the Stop hook still runs test+build even for docs-only changes).

## Implementation Approach
**Files to touch:** `prompts/shared/LOOP.md`, `prompts/shared/SPRINT-ROLLOVER.md`, `prompts/<agent>/*` (reduce/redirect), delete `prompts/**/Old/`, plus doc references.

- Diff the existing copies first to confirm they are truly identical modulo `{AGENT}`; reconcile any genuine per-agent differences before collapsing.
- Decide the substitution mechanism (a tiny generator script under `scripts/`, or documented manual `{AGENT}` replacement at dispatch). Avoid adding runtime deps.

## Test Strategy
- Documentation/prompt change — validation is the diff-equality check + grep for broken references + green gate.
- If a generator script is added, add a vitest test asserting it reproduces each agent's expected prompt.
