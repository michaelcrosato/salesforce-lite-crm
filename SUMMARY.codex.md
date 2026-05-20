Agent: Codex

Sprint: 4

Feature: Overnight autonomy Codex startup hardening

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 9de571e - [codex] automation: harden codex exec startup

Gate status: PASS

DoD self-check: PASS

Timestamp: 2026-05-20T01:54:32-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Replaced the real autonomy `codex exec ... -` prompt path with a native
  `codex.cmd` process launch that redirects prompt text into stdin instead of
  using a fragile PowerShell pipeline.
- Added `-CodexInvocationSmokeOnly` to `scripts/autonomy-loop.ps1`; it runs the
  same Codex invocation helper used by real iterations and verifies
  `--output-last-message` writes `OK`.
- Changed `scripts/start-codex-overnight.ps1` so the watchdog preflight runs
  that exact loop smoke path before rollback tag creation and before the
  long-running restart loop.
- Added `stdin is not a terminal` detection that writes `SUMMARY.codex.md` and
  `BLOCKERS.codex.md` startup-blocker reports, throws immediately, and prevents
  the watchdog from restarting a non-zero loop exit.
- Kept rollback tag behavior, baseline gate behavior, AutoRevertBroken,
  STOP/AUTONOMY.STOP checks, and green-gate-only push behavior intact.
- Eliminated the launcher path that used a direct PowerShell pipeline for the
  smoke; dry-run output now shows direct `pwsh -File ... -CodexInvocationSmokeOnly`
  invocation and no encoded-command path.
- Verification: parser checks passed, launcher dry-run passed, the Codex
  invocation smoke passed and produced `final.md` through `--output-last-message`,
  `git diff --check` passed, and the full required local gate passed:
  `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-gate.ps1`.

### Next action

Run the overnight launcher normally; if Codex stdin startup regresses, the
watchdog should now stop before the iteration loop and leave a blocker report.

### Scope confirmation

No cross-ownership edits: NO. `scripts/**` is Gemini-owned, but the current
prompt explicitly requested edits to `scripts/start-codex-overnight.ps1` and
`scripts/autonomy-loop.ps1`; implementation stayed inside those files.

CRM-CONTRACT.md honored: YES
