#Requires -Version 5.1
<#
.SYNOPSIS
  Start the Codex overnight watchdog from any PowerShell working directory.

.DESCRIPTION
  This wraps scripts/autonomy-loop.ps1 with the final preflight steps operators
  were running manually: Codex smoke, rollback tag creation/push, repo-rooted
  stop-file checks, and watchdog restart logging.

  The defaults intentionally match the full-send overnight Codex runner. Use
  the No* switches to disable individual behaviors for a safer dry run or
  workday run.
#>

[CmdletBinding()]
param(
  [string] $RepoRoot = "",
  [ValidateSet("codex")]
  [string] $Agent = "codex",
  [string] $RollbackTag = "",
  [int] $RestartDelaySeconds = 90,
  [int] $MaxIterations = 0,
  [int] $RepairAttemptsPerIteration = 5,
  [int] $MaxConsecutiveFailedIterations = 100,
  [int] $MaxNoProgressIterations = 0,
  [switch] $DryRun,
  [switch] $NoCodexSmoke,
  [switch] $NoRollbackTagPush,
  [switch] $NoFullYolo,
  [switch] $NoKeepAwake,
  [switch] $NoBaselineGate,
  [switch] $NoInstallBrowsers,
  [switch] $NoStartDockerServices,
  [switch] $NoAutoRevertBroken,
  [switch] $NoAllowSprintRollover,
  [switch] $NoPush,
  [switch] $PollOriginStop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = Join-Path $PSScriptRoot ".."
}

$script:RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$script:LoopScript = Join-Path $script:RepoRoot "scripts\autonomy-loop.ps1"

if ([string]::IsNullOrWhiteSpace($RollbackTag)) {
  $RollbackTag = "safe-before-yolo-{0}" -f (Get-Date -Format "yyyyMMdd-HHmmss")
}

$watchRoot = Join-Path $script:RepoRoot "agent-runs"
New-Item -ItemType Directory -Force -Path $watchRoot | Out-Null
$watchLog = Join-Path $watchRoot ("codex-watchdog-{0}.log" -f $RollbackTag)

function Get-Utf8NoBomEncoding {
  return (New-Object System.Text.UTF8Encoding -ArgumentList $false)
}

function Write-TextFile {
  param(
    [Parameter(Mandatory = $true)][string] $Path,
    [Parameter(Mandatory = $true)][string] $Text
  )

  $parent = Split-Path -Parent $Path
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Text, (Get-Utf8NoBomEncoding))
}

function Add-TextFileLine {
  param(
    [Parameter(Mandatory = $true)][string] $Path,
    [Parameter(Mandatory = $true)][string] $Text
  )

  $parent = Split-Path -Parent $Path
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::AppendAllText($Path, ($Text + [Environment]::NewLine), (Get-Utf8NoBomEncoding))
}

function Write-WatchLog {
  param([Parameter(Mandatory = $true)][string] $Message)
  Write-Host $Message
  Add-TextFileLine -Path $watchLog -Text $Message
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

function Get-GitText {
  param([Parameter(Mandatory = $true)][string[]] $GitArgs)

  $result = Invoke-NativeCapture { & git -C $script:RepoRoot @GitArgs 2>&1 }
  $output = $result.Output
  $exitCode = $result.ExitCode
  if ($exitCode -ne 0) {
    $text = (($output | Out-String).Trim())
    throw "git $($GitArgs -join ' ') failed with exit code $exitCode. $text"
  }
  return (($output | Out-String).Trim())
}

function Test-StopSignal {
  $stop = Join-Path $script:RepoRoot "STOP"
  $autonomyStop = Join-Path $script:RepoRoot "AUTONOMY.STOP"
  return ((Test-Path -LiteralPath $stop) -or (Test-Path -LiteralPath $autonomyStop))
}

function Get-CodexInvocationStartupFailure {
  param([AllowNull()][string] $Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
  if ($Text -match "(?m)^(?:error:\s*)?Failed to read prompt from stdin:\s*stdin is not a terminal\.?\s*$") { return "stdin is not a terminal" }
  if ($Text -match "(?m)^(?:error:\s*)?Failed to read prompt from stdin:\s*input is not valid UTF-8\.?\s*$") { return "input is not valid UTF-8" }
  if ($Text -match "(?m)^stdin is not a terminal\.?\s*$") { return "stdin is not a terminal" }
  if ($Text -match "(?m)^input is not valid UTF-8\.?\s*$") { return "input is not valid UTF-8" }
  if ($Text -match "(?m)^Failed to write UTF-8 prompt bytes to Codex stdin:" -or $Text -match "(?m)^.*pipe has been ended\.?\s*$") {
    return "stdin pipe closed before prompt write completed"
  }
  return ""
}

function Test-CodexStdinStartupFailure {
  param([AllowNull()][string] $Text)
  return (-not [string]::IsNullOrWhiteSpace((Get-CodexInvocationStartupFailure -Text $Text)))
}

function Set-LauncherStartupBlockerReport {
  param(
    [Parameter(Mandatory = $true)][string] $Evidence,
    [Parameter(Mandatory = $true)][string] $LogPath
  )

  $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
  $branch = "<unknown>"
  try { $branch = Get-GitText @("rev-parse", "--abbrev-ref", "HEAD") } catch {}

  $blockersPath = Join-Path $script:RepoRoot ("BLOCKERS.{0}.md" -f $Agent)
  $summaryPath = Join-Path $script:RepoRoot ("SUMMARY.{0}.md" -f $Agent)
  $escapedEvidence = $Evidence.Replace("|", "\|").Replace("`r", " ").Replace("`n", " ")
  $escapedLogPath = $LogPath.Replace("|", "\|")

  $blockers = @"
Agent: $Agent

Sprint: automation

Feature: overnight autonomy startup

Branch: $branch

Timestamp: $timestamp

Escalation required: YES

### Active blockers

| # | File / module | Type | Description | Evidence | Awaiting | Safe next action |
|---|--------------|------|-------------|----------|---------|-----------------|
| 1 | scripts/autonomy-loop.ps1 / scripts/start-codex-overnight.ps1 | gate | Codex overnight launcher failed before starting the watchdog loop. | $escapedEvidence See $escapedLogPath. | Fix the Codex invocation path or local Codex CLI startup behavior. | Do not restart the overnight loop until the Codex invocation smoke passes. |

### Resolved this prompt

- None.
"@

  $summary = @"
Agent: $Agent

Sprint: automation

Feature: overnight autonomy startup

Branch: $branch

Status: blocked

Commits this prompt: none

Gate status: NOT RUN

DoD self-check: FAIL

Timestamp: $timestamp

Approximate model tokens/spend this prompt: unknown

### Completed this prompt

- Overnight launcher stopped before the watchdog loop because Codex invocation
  preflight failed.
- Evidence: $Evidence
- Log: $LogPath

### Next action

Fix the Codex invocation path and rerun the smoke preflight before restarting
the overnight watchdog.

### Scope confirmation

Cross-zone edits: NO

CRM-CONTRACT.md honored:  YES
"@

  Write-TextFile -Path $blockersPath -Text $blockers
  Write-TextFile -Path $summaryPath -Text $summary
}

function Invoke-CodexSmoke {
  if ($NoCodexSmoke) {
    Write-WatchLog "SKIP Codex exec smoke because -NoCodexSmoke was supplied."
    return
  }

  $ps = Get-PowerShellExe
  $smokeArgs = Get-LoopArguments -CodexInvocationSmokeOnly
  Write-WatchLog "== Codex invocation smoke using autonomy-loop codex exec path =="
  Write-WatchLog ("SMOKE COMMAND: {0} {1}" -f $ps, (Format-CommandForLog -CommandArgs $smokeArgs))

  $result = Invoke-NativeCapture { & $ps @smokeArgs 2>&1 }
  $output = $result.Output
  $exitCode = $result.ExitCode
  $combined = (($output | Out-String).Trim())

  foreach ($line in $output) {
    $text = $line | Out-String
    $text = $text.TrimEnd()
    if ($text.Length -gt 0) {
      Write-Host $text
      Add-TextFileLine -Path $watchLog -Text $text
    }
  }

  if ($exitCode -ne 0) {
    $evidence = "Codex invocation smoke failed with exit code $exitCode."
    $startupFailure = Get-CodexInvocationStartupFailure -Text $combined
    if (-not [string]::IsNullOrWhiteSpace($startupFailure)) {
      $evidence = "Codex invocation smoke startup/invocation failure: $startupFailure."
    }
    Set-LauncherStartupBlockerReport -Evidence $evidence -LogPath $watchLog
    throw "Codex exec smoke test failed with exit code $exitCode. Do not start overnight automation."
  }
}

function Ensure-RollbackTag {
  Write-WatchLog "== Ensure rollback tag $RollbackTag =="

  Invoke-NativeCommand { & git -C $script:RepoRoot rev-parse -q --verify ("refs/tags/{0}" -f $RollbackTag) 2>$null } | Out-Null
  if ($script:LastNativeExitCode -eq 0) {
    Write-WatchLog "Rollback tag already exists locally: $RollbackTag"
  } else {
    Invoke-NativeCommand { & git -C $script:RepoRoot tag $RollbackTag HEAD } | Out-Null
    if ($script:LastNativeExitCode -ne 0) {
      throw "Failed to create rollback tag $RollbackTag."
    }
    Write-WatchLog "Created rollback tag at HEAD: $RollbackTag"
  }

  if ($NoRollbackTagPush) {
    Write-WatchLog "SKIP rollback tag push because -NoRollbackTagPush was supplied."
    return
  }

  Write-WatchLog "== Push rollback tag $RollbackTag =="
  Invoke-NativeCommand { & git -C $script:RepoRoot push origin ("refs/tags/{0}:refs/tags/{0}" -f $RollbackTag) }
  if ($script:LastNativeExitCode -ne 0) {
    throw "Rollback tag push failed. Do not start if you want remote rollback protection."
  }
}

function Format-CommandForLog {
  param([Parameter(Mandatory = $true)][string[]] $CommandArgs)

  $parts = @()
  foreach ($arg in $CommandArgs) {
    if ($arg -match '[\s"`]') {
      $parts += ('"{0}"' -f ($arg -replace '"', '\"'))
    } else {
      $parts += $arg
    }
  }
  return ($parts -join " ")
}

function Get-LoopArguments {
  param([switch] $CodexInvocationSmokeOnly)

  $args = @(
    "-NoLogo",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $script:LoopScript,
    "-Agent",
    $Agent,
    "-RunRoot",
    $script:RepoRoot,
    "-MaxIterations",
    [string]$MaxIterations,
    "-RepairAttemptsPerIteration",
    [string]$RepairAttemptsPerIteration,
    "-MaxConsecutiveFailedIterations",
    [string]$MaxConsecutiveFailedIterations,
    "-MaxNoProgressIterations",
    [string]$MaxNoProgressIterations
  )

  if (-not $NoFullYolo) { $args += "-FullYolo" }
  if (-not $NoKeepAwake) { $args += "-KeepAwake" }
  if (-not $NoBaselineGate) { $args += "-BaselineGate" }
  if (-not $NoInstallBrowsers) { $args += "-InstallBrowsers" }
  if (-not $NoStartDockerServices) { $args += "-StartDockerServices" }
  if (-not $NoAutoRevertBroken) { $args += "-AutoRevertBroken" }
  if (-not $NoAllowSprintRollover) { $args += "-AllowSprintRollover" }
  if (-not $NoPush) { $args += "-Push" }
  if ($PollOriginStop) { $args += "-PollOriginStop" }
  if ($CodexInvocationSmokeOnly) { $args += "-CodexInvocationSmokeOnly" }

  return $args
}

Require-Command "git" | Out-Null
$null = Get-GitText @("rev-parse", "--is-inside-work-tree")

if (-not (Test-Path -LiteralPath $script:LoopScript)) {
  throw "Missing autonomy loop script: $script:LoopScript"
}

Write-WatchLog "Watchdog log: $watchLog"
Write-WatchLog "RepoRoot: $script:RepoRoot"
Write-WatchLog ("Branch: {0}" -f (Get-GitText @("branch", "--show-current")))
Write-WatchLog ("HEAD: {0}" -f (Get-GitText @("rev-parse", "--short", "HEAD")))

if (Test-StopSignal) {
  Write-WatchLog "STOP/AUTONOMY.STOP exists under repo root. Watchdog exiting before preflight."
  exit 0
}

if ($DryRun) {
  $ps = Get-PowerShellExe
  $loopArgs = Get-LoopArguments
  $smokeArgs = Get-LoopArguments -CodexInvocationSmokeOnly
  Write-WatchLog ("DRY RUN: would run Codex smoke via {0} {1} unless -NoCodexSmoke is supplied." -f $ps, (Format-CommandForLog -CommandArgs $smokeArgs))
  Write-WatchLog "DRY RUN: would ensure rollback tag $RollbackTag and push it unless -NoRollbackTagPush is supplied."
  Write-WatchLog ("DRY RUN: would invoke {0} {1}" -f $ps, (Format-CommandForLog -CommandArgs $loopArgs))
  exit 0
}

Invoke-CodexSmoke
Ensure-RollbackTag

$psExe = Get-PowerShellExe
$loopArguments = Get-LoopArguments

while (-not (Test-StopSignal)) {
  $branch = Get-GitText @("branch", "--show-current")
  $head = Get-GitText @("rev-parse", "--short", "HEAD")
  $startLine = "START autonomy-loop at $(Get-Date -Format o) on $branch / $head"
  Write-WatchLog $startLine

  Invoke-NativeCommand { & $psExe @loopArguments }
  $exitCode = $script:LastNativeExitCode

  $exitLine = "EXIT autonomy-loop at $(Get-Date -Format o) with code $exitCode"
  Write-WatchLog $exitLine

  if ($exitCode -ne 0) {
    Write-WatchLog "Autonomy loop exited non-zero. Watchdog will not restart a failed startup/run."
    exit $exitCode
  }

  if (Test-StopSignal) {
    Write-WatchLog "Stop file found under repo root. Watchdog exiting."
    break
  }

  Write-WatchLog "Autonomy loop exited without stop file. Restarting in $RestartDelaySeconds seconds."
  Start-Sleep -Seconds $RestartDelaySeconds
}
