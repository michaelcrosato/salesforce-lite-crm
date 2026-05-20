Agent: Codex

Sprint: automation

Feature: Overnight autonomy Codex startup hardening

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 4cc2a93 - [codex] automation: enforce UTF-8 codex stdin

Gate status: PASS

DoD self-check: PASS

Timestamp: 2026-05-20T04:26:52-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Changed generated prompt/report writes to deterministic .NET UTF-8 without a
  BOM, and read generated prompts back as UTF-8 before invocation.
- Changed `Invoke-CodexProcess` to send prompt stdin as
  `[System.Text.Encoding]::UTF8.GetBytes(...)` through
  `StandardInput.BaseStream`, with stderr/log capture when the stdin pipe closes
  before the write completes.
- Classified `input is not valid UTF-8` and stdin pipe-closure failures with
  `stdin is not a terminal` as startup/invocation failures that write blocker
  evidence and throw immediately.
- Strengthened `-CodexInvocationSmokeOnly` with a smart-quotes-plus-Omega
  sentinel built from code points, so Windows PowerShell 5.1 cannot corrupt the
  script source before the UTF-8 stdin check.
- Made max-consecutive failed iterations exit non-zero so the watchdog does not
  restart a broken loop after repeated failures.
- Fixed the remaining `'-encodedCommand' is not recognized` warning by avoiding
  the `$Command` dynamic-scope collision in `Invoke-CommandInRepo`; the
  Playwright install wrapper now exits 0.
- Verification passed:
  `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\autonomy-loop.ps1 -FullYolo -CodexInvocationSmokeOnly`;
  `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-codex-overnight.ps1 -DryRun`;
  a bounded real watchdog probe reached `AUTONOMY ITERATION 1` and Codex
  accepted the prompt without UTF-8/stdin startup failure; `git diff --check`;
  and `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-gate.ps1`.

### Next action

Run the overnight launcher normally; if Codex stdin startup regresses, the
watchdog should now stop on the startup/invocation failure instead of burning
iterations or restarting after max consecutive failures.

### Scope confirmation

Cross-zone edits: YES. `scripts/**` is Gemini-owned, but the current prompt
explicitly scoped `scripts/autonomy-loop.ps1` and
`scripts/start-codex-overnight.ps1`; implementation stayed inside those files.

CRM-CONTRACT.md honored: YES
