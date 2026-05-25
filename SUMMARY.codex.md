Agent: Codex

Sprint: 36

Feature: S36-F2 - AI privacy and cost policy guardrails

Branch: main

Status: done

Commits this prompt:
- 3c6a2d3 - [codex] S36-F2: add AI policy guardrails

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after implementation; lint and typecheck passed, Vitest passed 79 files / 417 tests, build passed, and Playwright e2e passed 22/22.

DoD self-check: PASS

Timestamp: 2026-05-25T04:03:35.2032665-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/ai/policyGuardrails.ts` with typed local-only policy metadata for all current deterministic AI-style prompt surfaces: redaction-sensitive field catalogs, provider/secret/network/write/persistence disallowance, zero-token/zero-cost defaults, and explicit no auth/org quota enforcement.
- Added `tests/ai-policy-guardrails.test.ts` to verify policy coverage stays aligned with the prompt registry, all current surfaces expose redaction-sensitive fields, providers and secrets remain disallowed, and local deterministic accounting remains zero-cost.
- Reconciled current handoffs: `PLAN.md` §4 and `docs/FEATURE-BACKLOG.md` still list S36-F1/S36-F2 as queued, but recent implementation commits and the final green local gate support S36-F2 as done in this report.

### Next action

Run LOOP.md to begin S36-F3 - AI governance review packets.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
