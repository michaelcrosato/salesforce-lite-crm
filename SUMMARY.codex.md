Agent: Codex

Sprint: 4

Feature: Overnight autonomy watchdog hardening

Branch: codex/sprint-4-demo-seed-tuning

Status: done

Commits this prompt: 80edfdc - [codex] automation: add overnight watchdog launcher

Gate status: PASS

DoD self-check: PASS

Timestamp: 2026-05-19T23:20:14-07:00

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Added `scripts/start-codex-overnight.ps1`, a repo-rooted Codex watchdog
  launcher that can be started from any PowerShell working directory.
- Fixed the operator failure mode from `C:\WINDOWS\system32` by using
  `git -C`, absolute `RunRoot`/script paths, and repo-rooted `STOP` /
  `AUTONOMY.STOP` checks.
- Replaced the invalid `Test-Path .\STOP -or Test-Path .\AUTONOMY.STOP`
  pattern with a helper that evaluates each `Test-Path` call separately.
- Added rollback tag creation/push and Codex exec smoke preflight to the
  launcher before it starts the overnight loop.
- Added watchdog restart logging under ignored `agent-runs/` and defaulted the
  launcher to the intended overnight options: unlimited iterations, FullYolo,
  keep-awake, baseline gate, browser install, Docker service start,
  auto-revert-broken, sprint rollover, and push.
- Added `npm run autonomy:watchdog` and documented the safer launcher in
  `README.md`, `docs/LOCAL-GATE.md`, and `docs/AGENT-LOOPS.md`.
- Pushed/verified rollback tag `safe-before-yolo-20260519-225620` on `origin`.
- Verification: PowerShell parser check passed, launcher dry-run passed from
  `C:\WINDOWS\system32`, launcher dry-run passed from the repo root,
  `git ls-remote --tags origin safe-before-yolo-20260519-225620` confirmed the
  remote tag, and `scripts/local-gate.ps1` passed.

### Next action

Start the overnight loop with:

```powershell
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File C:\dev\salesforce-lite-crm\scripts\start-codex-overnight.ps1
```

### Scope confirmation

Cross-ownership edits: YES. `scripts/**` is Gemini-owned and `package.json` /
docs are shared/planning zones, but the current prompt explicitly requested an
automation fix for unattended Codex overnight operation. Edits were limited to
the launcher, package script registration, and operator docs.

CRM-CONTRACT.md honored: YES
