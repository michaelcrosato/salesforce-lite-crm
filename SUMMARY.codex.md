Agent: Codex

Sprint: 36

Feature: S36-F1 - Deterministic AI run receipts

Branch: main

Status: done

Commits this prompt:
- 77afd51 - [codex] S36-F1: add deterministic AI run receipts

Gate status: PASS - `scripts/local-gate.ps1` exited 0 after implementation; unit tests passed 78 files / 411 tests, build passed, and Playwright e2e passed 22/22.

DoD self-check: PASS

Timestamp: 2026-05-25T03:25:46.4332716-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `lib/ai/runReceipts.ts` with typed deterministic run receipts for current local AI-style prompt surfaces: prompt id/version, local deterministic provider label, validation status/issues, stable SHA-256 input/output hashes, zero token/cost defaults, and explicit no-write/no-network/no-provider/no-persistence flags.
- Added `tests/ai-run-receipts.test.ts` to cover all current deterministic eval fixtures, receipt determinism, invalid-output receipt status, stable key-order hashing, prompt-registry coverage, and provider-free safety metadata.
- Reconciled current handoffs: older Claude/Grok/Gemini summaries and `docs/PROJECT-CONTROL.md`/`docs/ROADMAP.md` still reference prior sprint state, but current `PLAN.md` §4, `docs/FEATURE-BACKLOG.md`, and the green local gate authorize Sprint 36 work.

### Next action

Run LOOP.md to begin S36-F2 - AI privacy and cost policy guardrails.

### Scope confirmation

No cross-ownership edits: YES

CRM-CONTRACT.md honored: YES
