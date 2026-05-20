#Requires -Version 5.1
<#+
.SYNOPSIS
  Salesforce Lite CRM full-autonomy local agent loop.

.DESCRIPTION
  Drop-in target for package.json script: npm run autonomy:overnight

  The runner is a control system. The repo-local prompt remains the implementation
  brain. For Codex, this script repeatedly feeds prompts/codex/LOOP.md to
  `codex exec`, runs scripts/local-gate.ps1, launches bounded repair prompts,
  invokes cleanup/commit prompts when a green gate leaves a dirty tree, pushes
  only clean green branches when requested, and can optionally revert failed
  uncommitted attempts to the last green commit.

  Logs are written under agent-runs/<agent>/<timestamp>/, which is already
  ignored by the current .gitignore.

  Use -FullYolo only in an isolated/trusted local runner.
#>

[CmdletBinding()]
param(
  [ValidateSet("codex")]
  [string] $Agent = "codex",

  [string] $RunRoot = "",

  # 0 means no iteration cap. Stop conditions still apply.
  [int] $MaxIterations = 8,

  [int] $RepairAttemptsPerIteration = 3,
  [int] $MaxConsecutiveFailedIterations = 2,
  [int] $MaxNoProgressIterations = 2,

  [string] $Model = "",

  # Adds --dangerously-bypass-approvals-and-sandbox.
  [switch] $FullYolo,

  # Optional setup/runner conveniences.
  [switch] $KeepAwake,
  [switch] $InstallBrowsers,
  [switch] $StartDockerServices,
  [switch] $BaselineGate,

  # Branch / push controls.
  [switch] $Push,
  [switch] $AllowMain,
  [switch] $AllowForeignBranch,
  [switch] $NoAutoBranch,
  [string] $BranchPrefix = "codex",

  # Recovery controls. This intentionally uses git clean -fd, not -fdx.
  [switch] $AutoRevertBroken,

  # Allows the runner to invoke prompts/codex/SPRINT-ROLLOVER.md when LOOP.md
  # reports SPRINT ROLLOVER NEEDED. Leave off when the operator only wants the
  # current sprint/task queue processed.
  [switch] $AllowSprintRollover,

  # Poll origin/main for STOP or AUTONOMY.STOP before each iteration.
  [switch] $PollOriginStop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RunRoot)) {
  $RunRoot = Join-Path $PSScriptRoot ".."
}

$script:RunRoot = (Resolve-Path -LiteralPath $RunRoot).Path
$script:Agent = $Agent
$script:BranchPrefix = $BranchPrefix
$script:StartedAt = Get-Date -Format "yyyyMMdd-HHmmss"
$script:RunDir = Join-Path $script:RunRoot ("agent-runs\{0}\{1}" -f $script:Agent, $script:StartedAt)
$script:GateScript = Join-Path $script:RunRoot "scripts\local-gate.ps1"
$script:LoopPrompt = Join-Path $script:RunRoot ("prompts\{0}\LOOP.md" -f $script:Agent)
$script:RolloverPrompt = Join-Path $script:RunRoot ("prompts\{0}\SPRINT-ROLLOVER.md" -f $script:Agent)
$script:TranscriptPath = Join-Path $script:RunDir ("TRANSCRIPT.{0}.{1}.log" -f $script:Agent, $script:StartedAt)
$script:MasterLog = Join-Path $script:RunDir "MASTER.log"
$script:LastGreenHead = $null

New-Item -ItemType Directory -Force -Path $script:RunDir | Out-Null

function Write-MasterLog {
  param([Parameter(Mandatory = $true)][string] $Text)
  Add-Content -LiteralPath $script:MasterLog -Value ("{0} {1}" -f (Get-Date -Format o), $Text)
}

function Require-Command {
  param([Parameter(Mandatory = $true)][string] $Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command not found on PATH: $Name"
  }
  return $cmd.Source
}

function Get-PowerShellExe {
  $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($pwsh) { return $pwsh.Source }

  $powershell = Get-Command powershell -ErrorAction SilentlyContinue
  if ($powershell) { return $powershell.Source }

  throw "Could not find pwsh or powershell on PATH."
}

function Invoke-NativeCommand {
  param([Parameter(Mandatory = $true)][scriptblock] $NativeCommand)

  $oldErrorActionPreference = $ErrorActionPreference
  $nativePreference = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
  $hasNativePreference = $null -ne $nativePreference
  $oldNativePreference = $null
  if ($hasNativePreference) {
    $oldNativePreference = $nativePreference.Value
  }

  try {
    $ErrorActionPreference = "Continue"
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $false
    }

    & $NativeCommand
  }
  finally {
    $script:LastNativeExitCode = $LASTEXITCODE
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $oldNativePreference
    }
    $ErrorActionPreference = $oldErrorActionPreference
  }
}

function Invoke-NativeCapture {
  param([Parameter(Mandatory = $true)][scriptblock] $NativeCommand)

  $script:LastNativeExitCode = 0
  $output = Invoke-NativeCommand -NativeCommand $NativeCommand
  return [pscustomobject]@{
    Output = $output
    ExitCode = $script:LastNativeExitCode
  }
}

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]] $GitArgs)

  Invoke-NativeCommand { & git -C $script:RunRoot @GitArgs }
  $exitCode = $script:LastNativeExitCode
  if ($exitCode -ne 0) {
    throw "git $($GitArgs -join ' ') failed with exit code $exitCode"
  }
}

function Get-GitText {
  param([Parameter(Mandatory = $true)][string[]] $GitArgs)

  $result = Invoke-NativeCapture { & git -C $script:RunRoot @GitArgs 2>&1 }
  $output = $result.Output
  return (($output | Out-String).Trim())
}

function Get-StatusText {
  return Get-GitText @("status", "--short")
}

function Get-HeadFull {
  return Get-GitText @("rev-parse", "HEAD")
}

function Get-HeadShort {
  return Get-GitText @("rev-parse", "--short", "HEAD")
}

function Write-TextFile {
  param(
    [Parameter(Mandatory = $true)][string] $Path,
    [Parameter(Mandatory = $true)][string] $Text
  )

  $parent = Split-Path -Parent $Path
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  Set-Content -LiteralPath $Path -Encoding UTF8 -Value $Text
}

function Invoke-LoggedNative {
  param(
    [Parameter(Mandatory = $true)][string] $Label,
    [Parameter(Mandatory = $true)][scriptblock] $Command,
    [Parameter(Mandatory = $true)][string] $LogPath
  )

  Add-Content -LiteralPath $LogPath -Value ""
  Add-Content -LiteralPath $LogPath -Value ("LABEL: {0}" -f $Label)
  Add-Content -LiteralPath $LogPath -Value ("PWD: {0}" -f $script:RunRoot)
  Add-Content -LiteralPath $LogPath -Value ("TIME: {0}" -f (Get-Date -Format o))
  Add-Content -LiteralPath $LogPath -Value "----------------------------------------"

  Push-Location $script:RunRoot
  try {
    $global:LASTEXITCODE = 0
    Invoke-NativeCommand { & $Command 2>&1 } | ForEach-Object {
      $line = $_ | Out-String
      $line = $line.TrimEnd()
      if ($line.Length -gt 0) { Write-Host $line }
      Add-Content -LiteralPath $LogPath -Value $line
    }
    $exitCode = $script:LastNativeExitCode
  }
  finally {
    Pop-Location
  }

  Add-Content -LiteralPath $LogPath -Value "----------------------------------------"
  Add-Content -LiteralPath $LogPath -Value ("EXIT_CODE: {0}" -f $exitCode)
  Add-Content -LiteralPath $LogPath -Value ""
  Write-MasterLog ("{0}: exit {1}" -f $Label, $exitCode)
  return $exitCode
}

function Invoke-LocalGate {
  param([Parameter(Mandatory = $true)][string] $LogPath)

  if (-not (Test-Path -LiteralPath $script:GateScript)) {
    throw "Missing local gate script: $script:GateScript"
  }

  $ps = Get-PowerShellExe
  return Invoke-LoggedNative -Label "local gate" -LogPath $LogPath -Command {
    & $ps -NoLogo -NoProfile -ExecutionPolicy Bypass -File $script:GateScript
  }
}

function Invoke-CommandInRepo {
  param(
    [Parameter(Mandatory = $true)][string] $Label,
    [Parameter(Mandatory = $true)][string] $Command,
    [Parameter(Mandatory = $true)][string] $LogPath
  )

  return Invoke-LoggedNative -Label $Label -LogPath $LogPath -Command {
    & cmd.exe /d /s /c $Command
  }
}

function Test-StopSignal {
  foreach ($name in @("STOP", "AUTONOMY.STOP")) {
    $localPath = Join-Path $script:RunRoot $name
    if (Test-Path -LiteralPath $localPath) {
      Write-Host "Stop signal found: $name"
      Write-MasterLog ("stop signal found: {0}" -f $name)
      return $true
    }
  }

  if ($PollOriginStop) {
    $remoteResult = Invoke-NativeCapture { & git -C $script:RunRoot remote get-url origin 2>$null }
    $remote = $remoteResult.Output
    if ($remoteResult.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace(($remote | Out-String).Trim())) {
      Invoke-NativeCommand { & git -C $script:RunRoot fetch --quiet origin main 2>$null } | Out-Null
      foreach ($name in @("STOP", "AUTONOMY.STOP")) {
        Invoke-NativeCommand { & git -C $script:RunRoot show ("origin/main:{0}" -f $name) 2>$null } | Out-Null
        if ($script:LastNativeExitCode -eq 0) {
          Write-Host "Remote stop signal found on origin/main: $name"
          Write-MasterLog ("remote stop signal found: {0}" -f $name)
          return $true
        }
      }
    }
  }

  return $false
}

function Set-KeepAwake {
  Write-Host "Applying AC power settings to prevent sleep/hibernate."
  $powercfg = Get-Command powercfg -ErrorAction SilentlyContinue
  if (-not $powercfg) {
    Write-Host "powercfg not found; skipping KeepAwake."
    return
  }

  Invoke-NativeCommand { & powercfg /change standby-timeout-ac 0 } | Out-Null
  Invoke-NativeCommand { & powercfg /change hibernate-timeout-ac 0 } | Out-Null
  Invoke-NativeCommand { & powercfg /change monitor-timeout-ac 30 } | Out-Null
}

function Start-DockerServicesIfPresent {
  $composeFiles = @("docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml")
  $hasCompose = $false
  foreach ($file in $composeFiles) {
    if (Test-Path -LiteralPath (Join-Path $script:RunRoot $file)) {
      $hasCompose = $true
      break
    }
  }

  if (-not $hasCompose) {
    Write-Host "No Docker Compose file detected. Skipping Docker startup."
    return
  }

  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    Write-Host "Docker not found on PATH. Skipping Docker startup."
    return
  }

  Push-Location $script:RunRoot
  try {
    $servicesResult = Invoke-NativeCapture { & docker compose config --services 2>$null }
    $services = $servicesResult.Output
    if ($servicesResult.ExitCode -ne 0) {
      Write-Host "docker compose config failed. Skipping Docker startup."
      return
    }

    $targets = @()
    foreach ($s in $services) {
      if ($s -eq "postgres" -or $s -eq "postgresql" -or $s -eq "redis") {
        $targets += $s
      }
    }

    if ($targets.Count -gt 0) {
      Write-Host ("Starting Docker services: {0}" -f ($targets -join ", "))
      Invoke-NativeCommand { & docker compose up -d @targets } | Out-Null
    } else {
      Write-Host "No postgres/postgresql/redis service detected."
    }
  }
  finally {
    Pop-Location
  }
}

function Ensure-BranchPolicy {
  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")

  if ($branch -eq "HEAD") {
    throw "Detached HEAD is not valid for unattended autonomy."
  }

  if ($branch -eq "main") {
    if ($AllowMain) {
      Write-Host "Running on main because -AllowMain was supplied."
      return
    }

    if ($NoAutoBranch) {
      throw "Refusing unattended feature work on main. Check out a $script:BranchPrefix/... branch, omit -NoAutoBranch, or pass -AllowMain for explicit control work."
    }

    $newBranch = "{0}/autonomy-{1}" -f $script:BranchPrefix, (Get-Date -Format "yyyyMMdd-HHmmss")
    Write-Host "On main. Creating autonomy branch: $newBranch"
    Invoke-Git @("checkout", "-b", $newBranch)
    return
  }

  if (-not $AllowForeignBranch -and -not $branch.StartsWith(("{0}/" -f $script:BranchPrefix))) {
    throw "Branch '$branch' does not start with '$script:BranchPrefix/'. Pass -AllowForeignBranch only when this is intentional."
  }
}

function Invoke-CodexPrompt {
  param(
    [Parameter(Mandatory = $true)][string] $PromptPath,
    [Parameter(Mandatory = $true)][string] $SummaryPath,
    [Parameter(Mandatory = $true)][string] $OutputPath
  )

  $codex = Require-Command "codex"
  $promptText = Get-Content -Raw -LiteralPath $PromptPath

  $args = @(
    "exec",
    "--cd", $script:RunRoot,
    "--output-last-message", $SummaryPath
  )

  if (-not [string]::IsNullOrWhiteSpace($Model)) {
    $args += @("--model", $Model)
  }

  if ($FullYolo) {
    $args += "--dangerously-bypass-approvals-and-sandbox"
  } else {
    $args += @("--sandbox", "workspace-write", "--ask-for-approval", "never")
  }

  $args += "-"

  Add-Content -LiteralPath $OutputPath -Value ""
  Add-Content -LiteralPath $OutputPath -Value ("COMMAND: codex {0}" -f ($args -join " "))
  Add-Content -LiteralPath $OutputPath -Value ("PWD: {0}" -f $script:RunRoot)
  Add-Content -LiteralPath $OutputPath -Value ("TIME: {0}" -f (Get-Date -Format o))
  Add-Content -LiteralPath $OutputPath -Value "----------------------------------------"

  Push-Location $script:RunRoot
  try {
    $global:LASTEXITCODE = 0
    Invoke-NativeCommand { $promptText | & $codex @args 2>&1 } | ForEach-Object {
      $line = $_ | Out-String
      $line = $line.TrimEnd()
      if ($line.Length -gt 0) { Write-Host $line }
      Add-Content -LiteralPath $OutputPath -Value $line
    }
    $exitCode = $script:LastNativeExitCode
  }
  finally {
    Pop-Location
  }

  Add-Content -LiteralPath $OutputPath -Value "----------------------------------------"
  Add-Content -LiteralPath $OutputPath -Value ("CODEX_EXIT_CODE: {0}" -f $exitCode)
  Add-Content -LiteralPath $OutputPath -Value ""
  Write-MasterLog ("codex prompt {0}: exit {1}" -f (Split-Path -Leaf $PromptPath), $exitCode)

  return $exitCode
}

function New-LoopPromptText {
  param([Parameter(Mandatory = $true)][int] $Iteration)

  if (-not (Test-Path -LiteralPath $script:LoopPrompt)) {
    throw "Missing loop prompt: $script:LoopPrompt"
  }

  $template = Get-Content -Raw -LiteralPath $script:LoopPrompt
  $template = $template.Replace("{AGENT}", $script:Agent)

  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")
  $head = Get-HeadShort
  $status = Get-StatusText
  $recent = Get-GitText @("log", "--oneline", "-12")
  $packageScripts = ""

  $packagePath = Join-Path $script:RunRoot "package.json"
  if (Test-Path -LiteralPath $packagePath) {
    $packageScripts = Get-Content -Raw -LiteralPath $packagePath
  }

  return @"
$template

============================================================
RUNNER CONTEXT — FULL AUTONOMY CONTROL WRAPPER
============================================================
This is iteration $Iteration launched by scripts/autonomy-loop.ps1.

Operator intent:
- Maximize useful repo progress while preserving repo safety.
- Human is not expected to intervene during this run.
- Do not stop for token/cost conservation. Unused expiring capacity has no value.
- Make the largest coherent safe slice permitted by PLAN.md, CRM-CONTRACT.md, ownership zones, and the current active queue.
- If no valid work remains, report the exact stop condition rather than inventing scope.

Current runner state:
- Agent: $script:Agent
- Worktree: $script:RunRoot
- Branch: $branch
- HEAD: $head
- FullYolo flag supplied to runner: $FullYolo
- Push after clean green gate: $Push
- AutoRevertBroken: $AutoRevertBroken
- AllowSprintRollover: $AllowSprintRollover

Important repo-local correction:
- Treat the actual current package.json and scripts/local-gate.ps1 as the validation authority when older prompt text disagrees.
- In the current tree, scripts/local-gate.ps1 runs npm install, env bootstrap, Prisma generate/db push, seed, lint, typecheck, test, build, Playwright chromium install, and e2e.
- Do not invent npm run validate. Use scripts/local-gate.ps1 for the full gate.

Current git status before this iteration:
$status

Recent commits:
$recent

Current package.json snapshot for scripts only / drift checks:
$packageScripts

Runner requirements:
- Do not commit agent-runs/ logs.
- Use scoped git add paths, not blind git add . or git add -A, unless you have verified the exact staged set and it excludes generated/log/local artifacts.
- If implementation changes pass, commit implementation atomically, then rewrite SUMMARY.$script:Agent.md and BLOCKERS.$script:Agent.md and commit report files separately.
- If blocked, update BLOCKERS.$script:Agent.md with exact command, exit code, final meaningful output, dirty paths, suspected cause, and safe next action.
- Final response should preserve the LOOP.md final schema and include whether another iteration is safe.
"@
}

function New-RepairPromptText {
  param(
    [Parameter(Mandatory = $true)][int] $Iteration,
    [Parameter(Mandatory = $true)][int] $Attempt,
    [Parameter(Mandatory = $true)][string] $GateLogPath
  )

  $status = Get-StatusText
  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")
  $head = Get-HeadShort
  $gateTail = ""

  if (Test-Path -LiteralPath $GateLogPath) {
    $gateTail = (Get-Content -LiteralPath $GateLogPath -Tail 260 | Out-String).Trim()
  }

  return @"
You are the autonomous $script:Agent repair agent for michaelcrosato/salesforce-lite-crm.

MISSION:
Repair the current worktree until scripts/local-gate.ps1 passes, preserving useful work where possible.

Context:
- Iteration: $Iteration
- Repair attempt: $Attempt / $RepairAttemptsPerIteration
- Worktree: $script:RunRoot
- Branch: $branch
- HEAD: $head
- Full unattended mode: active

READ FIRST:
1. README.md
2. PLAN.md
3. AGENTS.md
4. CRM-CONTRACT.md
5. docs/PROJECT-CONTROL.md
6. docs/LOCAL-GATE.md
7. docs/NEXT-PROMPTS.md
8. prompts/$script:Agent/LOOP.md
9. SUMMARY.$script:Agent.md
10. BLOCKERS.$script:Agent.md
11. package.json
12. scripts/local-gate.ps1

DO:
- Inspect git status and the failing command.
- Fix the smallest necessary scope.
- Preserve repo contract invariants and ownership-zone discipline.
- Re-run the smallest failing command first when useful.
- Re-run scripts/local-gate.ps1 before claiming repaired.
- Commit only if green, with scoped paths and report-only commit separation.
- Update SUMMARY.$script:Agent.md and BLOCKERS.$script:Agent.md.

DO NOT:
- Do not weaken tests, local gate, CRM-CONTRACT invariants, or route exclusions.
- Do not invent npm run validate.
- Do not create /deals/[id].
- Do not add auth, deployment, Salesforce integration, external AI, live integrations, or production operations.
- Do not commit generated DB files, logs, screenshots, node_modules, .next, or agent-runs.
- Do not force-push, rewrite history, delete worktrees, or run destructive database operations.

Current dirty status:
$status

Local gate output tail:
$gateTail

FINAL RESPONSE FORMAT:
STATUS: REPAIRED | BLOCKED
SUMMARY: one-sentence repair summary
TESTS: exact commands run and pass/fail
COMMITS: implementation/report commit short SHAs, or none
BLOCKERS: remaining blockers or none
NEXT: next safe runner action
"@
}

function New-CleanupPromptText {
  param([Parameter(Mandatory = $true)][int] $Iteration)

  $status = Get-StatusText
  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")
  $head = Get-HeadShort

  return @"
You are $script:Agent in cleanup/commit mode for Salesforce Lite CRM.

The runner just observed a green local gate, but git status is still dirty. Do not implement new feature scope.

MISSION:
Inspect the dirty worktree, stage only intentional scoped paths, create the required implementation/report commits if appropriate, and leave the tree clean. If dirty state is only generated or local artifacts, remove or ignore only when safe and documented.

Context:
- Iteration: $Iteration
- Branch: $branch
- HEAD: $head
- Worktree: $script:RunRoot

Rules:
- Do not run broad refactors.
- Do not commit agent-runs/, logs, generated DB files, .next, node_modules, screenshots, or local-only artifacts.
- Do not use blind git add . or git add -A unless you immediately verify the staged list and it contains only intentional files.
- Respect PLAN.md commit format and report-only commit separation.
- If unsure, update BLOCKERS.$script:Agent.md and stop with a dirty-state explanation.
- Re-run scripts/local-gate.ps1 if you change code or staging-relevant content.

Current dirty status:
$status

FINAL RESPONSE FORMAT:
STATUS: CLEANED | BLOCKED
SUMMARY: what was committed or left dirty
TESTS: commands run and pass/fail
COMMITS: short SHAs or none
REMAINING_DIRTY: none or exact status listing
NEXT: next safe runner action
"@
}

function New-RolloverPromptText {
  param([Parameter(Mandatory = $true)][int] $Iteration)

  if (-not (Test-Path -LiteralPath $script:RolloverPrompt)) {
    throw "Missing sprint rollover prompt: $script:RolloverPrompt"
  }

  $template = Get-Content -Raw -LiteralPath $script:RolloverPrompt
  $template = $template.Replace("{AGENT}", $script:Agent)

  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")
  $head = Get-HeadShort
  $status = Get-StatusText

  return @"
$template

============================================================
RUNNER CONTEXT — SPRINT ROLLOVER AUTHORIZED
============================================================
This is sprint rollover iteration $Iteration launched by scripts/autonomy-loop.ps1 because the previous LOOP.md pass reported SPRINT ROLLOVER NEEDED and -AllowSprintRollover was supplied.

- Agent: $script:Agent
- Worktree: $script:RunRoot
- Branch: $branch
- HEAD: $head
- Current git status:
$status

Use current package.json and scripts/local-gate.ps1 as validation truth. Do not invent product scope beyond PLAN.md / CRM-CONTRACT.md / docs/FEATURE-BACKLOG.md.
"@
}

function Invoke-RepairLoop {
  param(
    [Parameter(Mandatory = $true)][int] $Iteration,
    [Parameter(Mandatory = $true)][string] $InitialGateLogPath
  )

  $gateLogPath = $InitialGateLogPath

  for ($attempt = 1; $attempt -le $RepairAttemptsPerIteration; $attempt++) {
    Write-Host ""
    Write-Host ("----- REPAIR {0}/{1} for iteration {2} -----" -f $attempt, $RepairAttemptsPerIteration, $Iteration)

    $repairDir = Join-Path $script:RunDir ("iteration-{0:D3}\repair-{1:D2}" -f $Iteration, $attempt)
    New-Item -ItemType Directory -Force -Path $repairDir | Out-Null

    $repairPromptPath = Join-Path $repairDir "prompt.md"
    $repairSummaryPath = Join-Path $repairDir "final.md"
    $repairOutputPath = Join-Path $repairDir "agent-output.log"
    $repairGateLogPath = Join-Path $repairDir "local-gate.log"

    Write-TextFile -Path $repairPromptPath -Text (New-RepairPromptText -Iteration $Iteration -Attempt $attempt -GateLogPath $gateLogPath)

    $agentExit = Invoke-CodexPrompt -PromptPath $repairPromptPath -SummaryPath $repairSummaryPath -OutputPath $repairOutputPath
    if ($agentExit -ne 0) {
      Write-Host "Repair agent exited non-zero: $agentExit"
      $gateLogPath = $repairOutputPath
      continue
    }

    $gateExit = Invoke-LocalGate -LogPath $repairGateLogPath
    if ($gateExit -eq 0) {
      Write-Host "Local gate passed after repair attempt $attempt."
      $cleanupOk = Invoke-CleanupIfDirty -Iteration $Iteration
      if ($cleanupOk) {
        $script:LastGreenHead = Get-HeadFull
        return $true
      }

      $gateLogPath = $repairGateLogPath
      continue
    }

    Write-Host "Repair attempt $attempt did not produce a green gate."
    $gateLogPath = $repairGateLogPath
  }

  return $false
}

function Invoke-CleanupIfDirty {
  param([Parameter(Mandatory = $true)][int] $Iteration)

  $status = Get-StatusText
  if ([string]::IsNullOrWhiteSpace($status)) {
    return $true
  }

  Write-Host "Green gate but dirty tree remains. Invoking cleanup/commit prompt."

  $cleanupDir = Join-Path $script:RunDir ("iteration-{0:D3}\cleanup" -f $Iteration)
  New-Item -ItemType Directory -Force -Path $cleanupDir | Out-Null

  $cleanupPromptPath = Join-Path $cleanupDir "prompt.md"
  $cleanupSummaryPath = Join-Path $cleanupDir "final.md"
  $cleanupOutputPath = Join-Path $cleanupDir "agent-output.log"
  $cleanupGateLogPath = Join-Path $cleanupDir "local-gate.log"

  Write-TextFile -Path $cleanupPromptPath -Text (New-CleanupPromptText -Iteration $Iteration)
  $cleanupExit = Invoke-CodexPrompt -PromptPath $cleanupPromptPath -SummaryPath $cleanupSummaryPath -OutputPath $cleanupOutputPath

  if ($cleanupExit -ne 0) {
    Write-Host "Cleanup agent exited non-zero: $cleanupExit"
    return $false
  }

  $gateExit = Invoke-LocalGate -LogPath $cleanupGateLogPath
  if ($gateExit -ne 0) {
    Write-Host "Cleanup pass left the local gate red."
    return $false
  }

  $remaining = Get-StatusText
  if (-not [string]::IsNullOrWhiteSpace($remaining)) {
    Write-Host "Dirty tree remains after cleanup."
    Write-Host $remaining
    return $false
  }

  return $true
}

function Reset-ToLastGreenIfRequested {
  if (-not $AutoRevertBroken) {
    return
  }

  if ([string]::IsNullOrWhiteSpace($script:LastGreenHead)) {
    $script:LastGreenHead = Get-HeadFull
  }

  Write-Host ("AutoRevertBroken enabled. Resetting to last green HEAD {0}." -f $script:LastGreenHead)
  Invoke-Git @("reset", "--hard", $script:LastGreenHead)
  Invoke-Git @("clean", "-fd")
}

function Push-GreenBranchIfRequested {
  if (-not $Push) { return $true }

  $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD")
  if ($branch -eq "main" -and -not $AllowMain) {
    Write-Host "Refusing to push main without -AllowMain."
    return $false
  }

  $remoteResult = Invoke-NativeCapture { & git -C $script:RunRoot remote get-url origin 2>$null }
  $remote = $remoteResult.Output
  if ($remoteResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace(($remote | Out-String).Trim())) {
    Write-Host "No origin remote configured. Skipping push."
    return $true
  }

  Write-Host "Pushing green branch to origin HEAD."
  Invoke-NativeCommand { & git -C $script:RunRoot push origin HEAD }
  if ($script:LastNativeExitCode -ne 0) {
    Write-Host "Push failed. Stopping after green local state."
    return $false
  }

  return $true
}

function Read-SummaryText {
  param([string] $SummaryPath)
  if (Test-Path -LiteralPath $SummaryPath) {
    return Get-Content -Raw -LiteralPath $SummaryPath
  }
  return ""
}

function Test-SummaryRequestsRollover {
  param([string] $Text)
  return ($Text -match "SPRINT\s+ROLLOVER\s+NEEDED")
}

function Test-SummarySaysMergeReady {
  param([string] $Text)
  return ($Text -match "MERGE\s+READY")
}

function Test-SummarySaysBlockedHard {
  param([string] $Text)
  return ($Text -match "pre-flight unrecoverable" -or $Text -match "STATUS\s*:\s*BLOCKED")
}

Start-Transcript -Path $script:TranscriptPath -Append | Out-Null

try {
  Write-Host "========================================"
  Write-Host "Salesforce Lite CRM autonomy loop"
  Write-Host ("Agent: {0}" -f $script:Agent)
  Write-Host ("RunRoot: {0}" -f $script:RunRoot)
  Write-Host ("RunDir: {0}" -f $script:RunDir)
  Write-Host ("MaxIterations: {0}" -f $MaxIterations)
  Write-Host ("RepairAttemptsPerIteration: {0}" -f $RepairAttemptsPerIteration)
  Write-Host ("FullYolo: {0}" -f $FullYolo)
  Write-Host ("Push: {0}" -f $Push)
  Write-Host ("Started: {0}" -f (Get-Date))
  Write-Host "========================================"

  Write-MasterLog "started"

  Require-Command "git" | Out-Null
  Require-Command "npm" | Out-Null
  Require-Command "npx" | Out-Null
  Require-Command "codex" | Out-Null

  foreach ($required in @(
    "README.md",
    "PLAN.md",
    "AGENTS.md",
    "CRM-CONTRACT.md",
    "docs\PROJECT-CONTROL.md",
    "docs\LOCAL-GATE.md",
    "docs\NEXT-PROMPTS.md",
    "prompts\codex\LOOP.md",
    "scripts\local-gate.ps1",
    "package.json"
  )) {
    $full = Join-Path $script:RunRoot $required
    if (-not (Test-Path -LiteralPath $full)) {
      throw "Required repo file missing: $required"
    }
  }

  Invoke-Git @("rev-parse", "--is-inside-work-tree") | Out-Null
  Ensure-BranchPolicy

  if ($KeepAwake) { Set-KeepAwake }
  if ($StartDockerServices) { Start-DockerServicesIfPresent }

  if ($InstallBrowsers) {
    $browserLog = Join-Path $script:RunDir "playwright-install.log"
    Invoke-CommandInRepo -Label "npx playwright install chromium" -Command "npx playwright install chromium" -LogPath $browserLog | Out-Null
  }

  Write-Host ""
  Write-Host "Initial branch/status:"
  Invoke-NativeCommand { & git -C $script:RunRoot rev-parse --abbrev-ref HEAD }
  Invoke-NativeCommand { & git -C $script:RunRoot status --short }
  Write-Host "Recent commits:"
  Invoke-NativeCommand { & git -C $script:RunRoot log --oneline -8 }

  $checkWorktrees = Join-Path $script:RunRoot "scripts\check-worktrees.ps1"
  if (Test-Path -LiteralPath $checkWorktrees) {
    $worktreeLog = Join-Path $script:RunDir "check-worktrees.log"
    $ps = Get-PowerShellExe
    Invoke-LoggedNative -Label "check worktrees" -LogPath $worktreeLog -Command {
      & $ps -NoLogo -NoProfile -ExecutionPolicy Bypass -File $checkWorktrees
    } | Out-Null
  }

  $script:LastGreenHead = Get-HeadFull

  if ($BaselineGate) {
    Write-Host ""
    Write-Host "Running baseline local gate before autonomy loop."
    $baselineLog = Join-Path $script:RunDir "baseline-local-gate.log"
    $baselineExit = Invoke-LocalGate -LogPath $baselineLog
    if ($baselineExit -ne 0) {
      Write-Host "Baseline local gate failed. Starting repair loop before feature work."
      $baselineRepaired = Invoke-RepairLoop -Iteration 0 -InitialGateLogPath $baselineLog
      if (-not $baselineRepaired) {
        Reset-ToLastGreenIfRequested
        throw "Baseline local gate could not be repaired."
      }
    } else {
      $cleanupOk = Invoke-CleanupIfDirty -Iteration 0
      if (-not $cleanupOk) {
        throw "Baseline gate passed but cleanup did not produce a clean worktree."
      }
      $script:LastGreenHead = Get-HeadFull
    }
  }

  $iteration = 0
  $consecutiveFailures = 0
  $noProgressIterations = 0
  $nextPromptKind = "loop"

  while ($true) {
    if ($MaxIterations -gt 0 -and $iteration -ge $MaxIterations) {
      Write-Host "MaxIterations reached."
      break
    }

    if (Test-StopSignal) {
      Write-Host "Stopping because STOP/AUTONOMY.STOP was found."
      break
    }

    $iteration++
    $iterationDir = Join-Path $script:RunDir ("iteration-{0:D3}" -f $iteration)
    New-Item -ItemType Directory -Force -Path $iterationDir | Out-Null

    Write-Host ""
    Write-Host "========================================"
    Write-Host ("AUTONOMY ITERATION {0}" -f $iteration)
    Write-Host ("HEAD: {0}" -f (Get-HeadShort))
    Write-Host ("Prompt kind: {0}" -f $nextPromptKind)
    Write-Host ("Time: {0}" -f (Get-Date))
    Write-Host "========================================"

    $headBefore = Get-HeadFull
    $promptPath = Join-Path $iterationDir "prompt.md"
    $summaryPath = Join-Path $iterationDir "final.md"
    $agentOutputPath = Join-Path $iterationDir "agent-output.log"
    $gateLogPath = Join-Path $iterationDir "local-gate.log"

    if ($nextPromptKind -eq "rollover") {
      Write-TextFile -Path $promptPath -Text (New-RolloverPromptText -Iteration $iteration)
      $nextPromptKind = "loop"
    } else {
      Write-TextFile -Path $promptPath -Text (New-LoopPromptText -Iteration $iteration)
    }

    $agentExit = Invoke-CodexPrompt -PromptPath $promptPath -SummaryPath $summaryPath -OutputPath $agentOutputPath
    if ($agentExit -ne 0) {
      Write-Host ("Agent exited non-zero: {0}" -f $agentExit)
      $consecutiveFailures++
      Reset-ToLastGreenIfRequested

      if ($consecutiveFailures -ge $MaxConsecutiveFailedIterations) {
        Write-Host "Max consecutive failed iterations reached."
        break
      }

      continue
    }

    $gateExit = Invoke-LocalGate -LogPath $gateLogPath

    if ($gateExit -ne 0) {
      Write-Host "Local gate failed after iteration. Starting repair loop."
      $repaired = Invoke-RepairLoop -Iteration $iteration -InitialGateLogPath $gateLogPath

      if (-not $repaired) {
        Write-Host "Repair loop failed to restore green gate."
        $consecutiveFailures++
        Reset-ToLastGreenIfRequested

        if ($consecutiveFailures -ge $MaxConsecutiveFailedIterations) {
          Write-Host "Max consecutive failed iterations reached."
          break
        }

        continue
      }
    } else {
      Write-Host "Local gate passed after iteration."
      $cleanupOk = Invoke-CleanupIfDirty -Iteration $iteration
      if (-not $cleanupOk) {
        Write-Host "Cleanup failed or dirty state remains after green gate."
        $consecutiveFailures++
        Reset-ToLastGreenIfRequested

        if ($consecutiveFailures -ge $MaxConsecutiveFailedIterations) {
          Write-Host "Max consecutive failed iterations reached."
          break
        }

        continue
      }
    }

    $remaining = Get-StatusText
    if (-not [string]::IsNullOrWhiteSpace($remaining)) {
      Write-Host "Stopping because worktree is still dirty after cleanup/repair."
      Write-Host $remaining
      break
    }

    $script:LastGreenHead = Get-HeadFull
    $pushOk = Push-GreenBranchIfRequested
    if (-not $pushOk) {
      break
    }

    $consecutiveFailures = 0
    $headAfter = Get-HeadFull
    $summaryText = Read-SummaryText -SummaryPath $summaryPath

    if (Test-SummarySaysMergeReady -Text $summaryText) {
      Write-Host "Agent reported MERGE READY. Stopping feature loop."
      break
    }

    if (Test-SummaryRequestsRollover -Text $summaryText) {
      if ($AllowSprintRollover) {
        Write-Host "Agent requested sprint rollover and -AllowSprintRollover is enabled. Next iteration will run SPRINT-ROLLOVER.md."
        $nextPromptKind = "rollover"
      } else {
        Write-Host "Agent requested sprint rollover. Stopping because -AllowSprintRollover was not supplied."
        break
      }
    }

    if (Test-SummarySaysBlockedHard -Text $summaryText) {
      Write-Host "Agent reported BLOCKED/pre-flight unrecoverable. Stopping."
      break
    }

    if ($headBefore -eq $headAfter) {
      $noProgressIterations++
      Write-Host ("No commit progress detected in this iteration ({0}/{1})." -f $noProgressIterations, $MaxNoProgressIterations)
      if ($MaxNoProgressIterations -gt 0 -and $noProgressIterations -ge $MaxNoProgressIterations) {
        Write-Host "No-progress stop reached."
        break
      }
    } else {
      $noProgressIterations = 0
    }
  }

  Write-Host ""
  Write-Host "========================================"
  Write-Host "Autonomy loop finished"
  Write-Host ("Finished: {0}" -f (Get-Date))
  Write-Host ("HEAD: {0}" -f (Get-HeadShort))
  Write-Host "Latest commits:"
  Invoke-NativeCommand { & git -C $script:RunRoot log --oneline -12 }
  Write-Host "Current status:"
  Invoke-NativeCommand { & git -C $script:RunRoot status --short }
  Write-Host ("Logs: {0}" -f $script:RunDir)
  Write-Host "========================================"

  Write-MasterLog "finished"
}
finally {
  Stop-Transcript | Out-Null
}
