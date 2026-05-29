# 007 — Reconcile phantom ownership zones (docs ↔ reality)

- **Wave:** Phase 0 — Quick Wins & Safety
- **Status:** [ ] Todo
- **Scores:** Impact 2/5 · Feasibility 5/5 · Risk Low · Codebase Fit 5/5
- **Depends on:** none
- **Scope gate:** In-scope; **`.claude/zones.json` edits require a `[CONFIG CHANGE]` tag** (CLAUDE.md §10)
- **Related:** `AGENTS.md` (Ownership Zones, ~L133), `.claude/zones.json`, `PLAN.md` §5

## Description & Expected Impact
`AGENTS.md` and the ownership zones reference `lib/types/`, `lib/db/`, and `lib/forecast/` — **none of which exist**. In reality: types are inline/co-located, DB access is `lib/prisma.ts`, and forecasting is `lib/business/forecast.ts`. This doc↔reality drift confuses both human readers and the zone-guard hooks that downstream agents rely on to decide what they may edit.

Impact: removes a correctness trap in the agent coordination layer. Small but it protects every future autonomous iteration.

## Definition of Done & Acceptance Criteria
- [ ] `AGENTS.md` Ownership Zones list only paths that exist; the Codex zone reads (e.g.) `lib/server/`, `lib/services/`, `lib/business/`, `lib/routing/`, `lib/ai/`, `prisma/seed.ts` — matching the real tree.
- [ ] `.claude/zones.json` is consistent with `AGENTS.md` (committed with a `[CONFIG CHANGE]` tag).
- [ ] `PLAN.md` §5 (if it lists the same zones) is reconciled.
- [ ] `grep -rn "lib/types\|lib/db\|lib/forecast" --include=*.md` returns no stale references (except this spec / historical archives).
- [ ] Gate green.

## Implementation Approach
**Files to touch:** `AGENTS.md`, `.claude/zones.json` (CONFIG CHANGE), `PLAN.md` §5 if applicable.

- Prefer **fixing the docs** to match the tree (do NOT create empty `lib/types|db|forecast` dirs just to satisfy the docs).
- Cross-check against `git ls-files lib` so the corrected list is authoritative.

## Test Strategy
- Documentation change — validation is the grep check above plus a green gate (the Stop hook still runs test+build).
- Optional: a tiny reachability assertion that every path named in `zones.json` exists on disk (could fold into spec 011's reachability script).
