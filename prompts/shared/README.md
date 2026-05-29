# Shared Prompts

Store shared prompt templates here.

Shared prompts should reference `PLAN.md`, `CRM-CONTRACT.md`, `AGENTS.md`, and
the relevant docs. They should include branch/path/topology/gate instructions
and should not silently override `PLAN.md`.

- `LOOP.md` — canonical one-iteration loop prompt. Generated to each
  `prompts/<agent>/LOOP.md` by `scripts/generate-agent-prompts.mjs`; the
  `{AGENT}` token is substituted at dispatch. Drift-guarded by
  `tests/prompts/agent-prompts.test.ts`.
- `SPRINT-ROLLOVER.md` — canonical sprint-rollover prompt; generated the same way.
- `IFTv22PC-YOLO.md` — shared IFT / planning prompt for repo-level review and implementation handoff.
