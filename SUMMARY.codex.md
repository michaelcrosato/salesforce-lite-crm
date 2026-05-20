Agent: Codex

Sprint: 4

Feature: Overnight autonomy native stderr hardening

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 149a1f9 - [codex] automation: tolerate native stderr

Gate status: PASS

DoD self-check: PASS

Timestamp: 2026-05-19T23:49:30.2268322-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added scoped native-command wrappers to `scripts/start-codex-overnight.ps1`
  and `scripts/autonomy-loop.ps1` so Codex, Git, child PowerShell, Docker,
  and push calls can emit stderr without PowerShell stopping before exit-code
  handling.
- Preserved default/latest Codex model behavior, FullYolo defaults, rollback
  tag creation/push, watchdog restart, STOP/AUTONOMY.STOP checks, local gate
  handling, AutoRevertBroken, and green-gate-only push behavior.
- Made `scripts/autonomy-loop.ps1` default `RunRoot` to the script's repo root
  when launched directly from any working directory.
- Verification: parser check passed, launcher dry-run passed from
  `C:\WINDOWS\system32`, direct loop launch from `C:\WINDOWS\system32`
  handled Codex stderr by exit code, and `scripts/local-gate.ps1` passed.

### Next action

Start the overnight loop with the repo-rooted launcher command below.

### Scope confirmation

No cross-ownership edits: NO. `scripts/**` is Gemini-owned, but the current
prompt explicitly requested automation fixes in `scripts/start-codex-overnight.ps1`
and `scripts/autonomy-loop.ps1`; edits were limited to that scope.

CRM-CONTRACT.md honored: YES
