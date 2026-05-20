Agent: Codex

Sprint: automation

Feature: Overnight autonomy false startup stop investigation

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: d8cfde5 - [codex] automation: avoid false stdin startup stops

Gate status: PASS - `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-gate.ps1` exited 0; 152 Vitest tests and 19 Playwright tests passed. Targeted Codex invocation smoke also passed.

DoD self-check: PASS

Timestamp: 2026-05-20T08:40:14-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Confirmed the 2026-05-20 07:39 overnight attempt ran one inner autonomy iteration, not multiple feature loops.
- Found the stop was a wrapper false positive: `codex exec` exited 0 and produced a GREEN final answer, but the runner scanned the echoed prompt/history and matched old text containing `stdin is not a terminal`.
- Tightened startup-failure detection in `scripts/autonomy-loop.ps1` and `scripts/start-codex-overnight.ps1` so successful Codex runs are not failed by prompt/history text.
- Preserved real startup failure handling for non-zero Codex exits and actual stdin write failures.

### Next action

Rerun the overnight launcher normally. If the next Codex iteration exits cleanly, the watchdog should continue instead of stopping on the old false startup blocker.

### Scope confirmation

Cross-zone edits: YES. `scripts/**` is Gemini-owned, but the current prompt directly investigated and fixed the Codex overnight launcher/loop scripts.

CRM-CONTRACT.md honored: YES
