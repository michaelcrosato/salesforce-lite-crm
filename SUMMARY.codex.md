Agent: Codex

Sprint: 4

Feature: S4-F1 - Demo seed tuning

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 6dd448e - [codex] S4-F1: add seed routing payloads

Gate status: PASS - `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-gate.ps1` exited 0; 152 Vitest tests and 19 Playwright tests passed.

DoD self-check: PASS

Timestamp: 2026-05-20T09:03:46-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added deterministic structured JSON payloads to seeded `routing_event` activities in `prisma/seed.ts`, preserving the existing human-readable summaries and next steps.
- Verified a seeded Vancouver lead (`lead-1`, postal prefix `V5K`) reads back routing steps `normalize`, `extract_prefix`, `match_area`, `filter_orders`, `rank_pace_gap`, and `select`, with ranked Vancouver candidate orders.
- Updated `docs/schema-changelog.md` with the required seed-change entry.
- Ran the full local gate through `scripts/local-gate.ps1`; it completed successfully.

### Discovered this prompt

- `PLAN.md` §4 lists Sprint 4 queued, while historical Claude/Grok/Gemini summaries still reference Sprint 4B branches and statuses. Treated those summaries as historical because `docs/NEXT-PROMPTS.md` and `prompts/README.md` mark the Sprint 4B prompts as superseded.
- `PLAN.md` §9 still contains stale prose saying `lint` and `typecheck` scripts do not exist, but the current prompt, `package.json`, `docs/LOCAL-GATE.md`, and `scripts/local-gate.ps1` include them. Used the current prompt and local gate output as the higher authority.

### Next action

Codex S4-F1 is merge-ready from this branch; no Codex-owned Sprint 4 blocker remains.

### Scope confirmation

No cross-ownership edits: NO - `docs/schema-changelog.md` was updated as the smallest required coordination line for a seed change.

CRM-CONTRACT.md honored: YES
