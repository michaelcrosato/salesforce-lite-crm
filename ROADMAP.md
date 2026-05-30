# ROADMAP

## Purpose

Keep autonomous agent work stable and reversible by making the repo’s current
state, next work, and execution contract explicit.

## Current state

- Product contract and ownership rules: `PLAN.md` and `CRM-CONTRACT.md`.
- Current implementation cadence is driven by active tickets in `tickets/` and branch
  scope in `PLAN.md`.
- Readability, tooling, and testability hardening is active in this run (agent
  script wrappers + AFK documentation map updates).

## Desired end state

- One documented, repeatable agent loop for any newcomer.
- Reliable agent-specific scripts for bootstrap/check/status/format/test/typecheck/lint.
- Minimal token overhead for session initialization.
- Stronger drift prevention: every doc and ticket reflects actual behavior and
  passing checks.

## Phased plan

### Phase A — Stabilize tooling (in progress)

1. Keep `scripts/agent/{bootstrap,doctor,check,lint,typecheck,test,format,status}.sh`
   package-manager aware and non-failing when optional tooling is absent.
2. Align `AGENTS.md`/`GOAL.md`/`docs/ai/REPO_MAP.md`/`README.md` to the same
   read-first flow.
3. Ensure `.aiignore` skips generated artifacts consistently.

### Phase B — Repair / harden docs and tickets

1. Add/update ticket set with explicit, atomic acceptance criteria and commands.
2. Keep `docs/PROJECT-CONTROL.md` and `docs/LOCAL-GATE.md` synchronized with
   current command behavior.
3. Point `CLAUDE.md` and `.cursor/rules` at this canonical instruction set.

### Phase C — Quality and safety loop (continuation)

1. Add/refresh focused tickets for:
   - bootstrap/dependencies checks
   - agent script hardening
   - docs map and AFK workflow polish
2. Run health checks (`lint`, `typecheck`, `test`, `build`, `agent:format`).
3. Merge through `main` with an explicitly green PR gate process.

### Phase D — Growth

1. Execute open backlog tickets from `PLAN.md`.
2. Address non-afk blockers only when reproducible and gated.
3. Promote new capability changes only through `PLAN.md` updates and `CRM-CONTRACT.md`.

## Prioritized tickets

- AFK readiness (this run): `TICKET010`, `TICKET011`, `TICKET012`.
- Repo hygiene and observability: `TICKET005`, `TICKET006` (if additional
  regressions appear).
- CI/process robustness: `TICKET001`, `TICKET008` (if gate/e2e regressions re-emerge).

## Risks / blockers

- Missing explicit package-manager policy in automation contexts.
- Divergence between docs and script behavior.
- Hidden high-cost failures in tests if hidden dependencies drift.

## Maintenance loop

1. Pick an open ticket aligned with the active PROMPT scope.
2. Apply the smallest scoped edit and run targeted checks.
3. Update `tickets/TICKET*.md` checkboxes and `docs/PROJECT-CONTROL.md` if status
   changed.
4. Record results and remaining risk; proceed to next ticket.
