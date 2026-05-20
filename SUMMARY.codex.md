Agent: Codex

Sprint: automation

Feature: Overnight watchdog continuous recovery

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 6cfa374 - [codex] automation: keep watchdog recovering overnight

Gate status: PASS - `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-gate.ps1` exited 0; 152 Vitest tests and 19 Playwright tests passed. Watchdog dry run and Codex invocation smoke also passed.

DoD self-check: PASS

Timestamp: 2026-05-20T08:50:48-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Changed `scripts/start-codex-overnight.ps1` so non-zero inner-loop exits no longer stop the overnight watchdog by default.
- Added recovery behavior: log the failed loop, re-run Codex invocation smoke, wait briefly, then restart the inner loop.
- Kept stop controls: `STOP` / `AUTONOMY.STOP` stop the watchdog, while `-StopOnLoopFailure` and `-StopOnCodexSmokeFailure` restore fail-fast debugging behavior.
- Documented the continuous recovery behavior in `docs/AGENT-LOOPS.md`.

### Next action

Start the overnight watchdog from an external PowerShell window. The default launcher now keeps recovering/restarting until a stop file is present or the host process is closed.

### Scope confirmation

Cross-zone edits: YES. `scripts/**` is Gemini-owned, but the current prompt directly authorized watchdog automation hardening; docs update stayed in the agent-loop operations doc.

CRM-CONTRACT.md honored: YES
