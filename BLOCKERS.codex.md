Agent: Codex

Sprint: 4

Feature: Overnight autonomy Codex startup hardening

Branch: codex/sprint-4-demo-seed-tuning

Timestamp: 2026-05-20T01:54:32-07:00

Escalation required: NO

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|

### Resolved this prompt

- Resolved the overnight automation startup failure where every autonomy
  iteration exited with `Error: stdin is not a terminal` after a green baseline
  gate.
- Added a Codex invocation smoke that uses the same native process path as real
  iterations and includes `--output-last-message`.
- Added fail-fast blocker-report behavior for future `stdin is not a terminal`
  startup failures so the watchdog does not restart the broken loop repeatedly.
- Eliminated the direct PowerShell pipeline smoke path; no encoded-command path
  is used by the updated launcher.
- Full local gate passed via `powershell -NoLogo -NoProfile -ExecutionPolicy
  Bypass -File .\scripts\local-gate.ps1`.
