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

function Write-WatchLog {
  param([Parameter(Mandatory = $true)][string] $Message)
  Write-Host $Message
  Add-Content -LiteralPath $watchLog -Encoding UTF8 -Value $Message
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

function Invoke-CodexSmoke {
  if ($NoCodexSmoke) {
    Write-WatchLog "SKIP Codex exec smoke because -NoCodexSmoke was supplied."
    return
  }

  $codex = Require-Command "codex"
  Write-WatchLog "== Codex YOLO smoke test using default/latest configured model =="

  $result = Invoke-NativeCapture {
    "Return exactly OK." | & $codex exec `
      --cd $script:RepoRoot `
      --dangerously-bypass-approvals-and-sandbox `
      - 2>&1
  }
  $output = $result.Output
  $exitCode = $result.ExitCode

  foreach ($line in $output) {
    $text = $line | Out-String
    $text = $text.TrimEnd()
    if ($text.Length -gt 0) {
      Write-Host $text
      Add-Content -LiteralPath $watchLog -Encoding UTF8 -Value $text
    }
  }

  if ($exitCode -ne 0) {
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
  Write-WatchLog "DRY RUN: would run Codex smoke unless -NoCodexSmoke is supplied."
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

  if (Test-StopSignal) {
    Write-WatchLog "Stop file found under repo root. Watchdog exiting."
    break
  }

  Write-WatchLog "Autonomy loop exited without stop file. Restarting in $RestartDelaySeconds seconds."
  Start-Sleep -Seconds $RestartDelaySeconds
}
