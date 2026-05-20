Agent: Codex

Sprint: automation

Feature: Overnight autonomy Codex startup hardening

Branch: codex/sprint-4-demo-seed-tuning

Timestamp: 2026-05-20T04:26:52-07:00

Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|

### Resolved this prompt

- Resolved the repeated real-iteration startup failure:
  `Failed to read prompt from stdin: input is not valid UTF-8`.
- Strengthened the Codex invocation smoke with a non-ASCII sentinel and verified
  it fails when the sentinel is corrupted before stdin, then passes when the
  prompt is written as UTF-8 bytes.
- Resolved the lingering `'-encodedCommand' is not recognized` warning from the
  pre-loop Playwright install wrapper.
- Ensured max-consecutive iteration failures no longer exit 0, preventing the
  watchdog from restarting a broken loop.
- Full local gate passed via `powershell -NoLogo -NoProfile -ExecutionPolicy
  Bypass -File .\scripts\local-gate.ps1`.
