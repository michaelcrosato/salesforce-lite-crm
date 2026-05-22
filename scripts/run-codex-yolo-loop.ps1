#Requires -Version 5.1
<#
.SYNOPSIS
  Conservative single-agent Codex YOLO loop harness.

.DESCRIPTION
  PR1 scaffold runner for the canonical single-agent loop. It roots all paths
  from this script location, verifies protected-file integrity before trusting
  work, and reuses scripts/local-gate.ps1 unchanged.

  .claude hooks are Claude Code hooks. Do not assume they protect Codex CLI
  runs. Under this runner, integrity checking is detection-after-the-fact, not
  physical prevention by sandboxing.

  Live unattended YOLO mode should run only in an isolated worktree, VM, or
  disposable host with no production credentials and no irreversible live-world
  privileges. The wall-clock fuse is per script invocation and resets when this
  script is relaunched.
#>

[CmdletBinding()]
param(
  [switch] $Once,
  [switch] $DryRun,
  [switch] $Launch,
  [int] $MaxIterations = 3,
  [int] $MaxRuntimeMinutes = 60,
  [int] $IterationTimeoutMinutes = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$AssertScript = Join-Path $RepoRoot "scripts\assert-gate-integrity.ps1"
$LocalGateScript = Join-Path $RepoRoot "scripts\local-gate.ps1"
$AxiomsPath = Join-Path $RepoRoot "docs\AXIOMS.md"
$LoopDoctrinePath = Join-Path $RepoRoot "docs\AGENT-LOOP.md"
$LoopLogPath = Join-Path $RepoRoot "docs\LOOP_LOG.md"
$ArtifactRoot = Join-Path $RepoRoot "docs\loop-artifacts"
$script:LastGreenHead = ""
$script:LastSavedUntrackedPaths = @()

function Get-Utf8NoBomEncoding {
  return (New-Object System.Text.UTF8Encoding -ArgumentList $false)
}

function Read-TextFile {
  param([Parameter(Mandatory = $true)][string] $Path)
  return [System.IO.File]::ReadAllText($Path, (Get-Utf8NoBomEncoding))
}

function Write-TextFile {
  param(
    [Parameter(Mandatory = $true)][string] $Path,
    [Parameter(Mandatory = $true)][string] $Text
  )

  $parent = Split-Path -Parent $Path
  if ($parent) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  [System.IO.File]::WriteAllText($Path, $Text, (Get-Utf8NoBomEncoding))
}

function Add-TextFileLine {
  param(
    [Parameter(Mandatory = $true)][string] $Path,
    [Parameter(Mandatory = $true)][string] $Text
  )

  $parent = Split-Path -Parent $Path
  if ($parent) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  [System.IO.File]::AppendAllText($Path, ($Text + [Environment]::NewLine), (Get-Utf8NoBomEncoding))
}

function Require-File {
  param([Parameter(Mandatory = $true)][string] $Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Required file is missing: $Path"
  }
}

function Require-Command {
  param([Parameter(Mandatory = $true)][string] $Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Required command not found on PATH: $Name"
  }
  return $command.Source
}

function Get-PowerShellExe {
  $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($pwsh) { return $pwsh.Source }

  $powershell = Get-Command powershell -ErrorAction SilentlyContinue
  if ($powershell) { return $powershell.Source }

  throw "Could not find pwsh or powershell on PATH."
}

function Get-CodexExecutable {
  $cmdShim = Get-Command "codex.cmd" -ErrorAction SilentlyContinue
  if ($cmdShim) { return $cmdShim.Source }

  $codex = Get-Command "codex" -ErrorAction SilentlyContinue
  if (-not $codex) {
    throw "Required command not found on PATH: codex"
  }

  if ($codex.Source -and $codex.Source.EndsWith(".ps1", [System.StringComparison]::OrdinalIgnoreCase)) {
    $siblingCmd = [System.IO.Path]::ChangeExtension($codex.Source, ".cmd")
    if (Test-Path -LiteralPath $siblingCmd) {
      return $siblingCmd
    }
  }

  return $codex.Source
}

function Invoke-NativeCommand {
  param([Parameter(Mandatory = $true)][scriptblock] $Command)

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

    & $Command
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
  param([Parameter(Mandatory = $true)][scriptblock] $Command)
  $script:LastNativeExitCode = 0
  $output = Invoke-NativeCommand -Command $Command
  return [pscustomobject]@{
    Output = $output
    ExitCode = $script:LastNativeExitCode
  }
}

function Invoke-RequiredScript {
  param(
    [Parameter(Mandatory = $true)][string] $Label,
    [Parameter(Mandatory = $true)][string] $ScriptPath
  )

  $ps = Get-PowerShellExe
  Write-Host ""
  Write-Host "==> $Label"
  Invoke-NativeCommand {
    & $ps -NoLogo -NoProfile -ExecutionPolicy Bypass -File $ScriptPath
  }
  if ($script:LastNativeExitCode -ne 0) {
    throw "$Label failed with exit code $script:LastNativeExitCode"
  }
}

function Get-GitText {
  param([Parameter(Mandatory = $true)][string[]] $Arguments)
  $result = Invoke-NativeCapture {
    & git -C $RepoRoot @Arguments 2>&1
  }
  if ($result.ExitCode -ne 0) {
    $text = (($result.Output | Out-String).Trim())
    throw "git $($Arguments -join ' ') failed with exit code $($result.ExitCode). $text"
  }
  return (($result.Output | Out-String).Trim())
}

function Get-GitStatusShort {
  return Get-GitText -Arguments @("status", "--short")
}

function Require-MainBranchForLive {
  $branch = Get-GitText -Arguments @("branch", "--show-current")
  if ($branch -ne "main") {
    throw "Live mode commits only to main after validation. Current branch is '$branch'. Check out main before using -Launch."
  }
}

function Require-CleanWorktreeForLive {
  $status = Get-GitStatusShort
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    throw "Live mode requires a clean worktree before launch. Current dirty status:`n$status"
  }
}

function Get-UntrackedRepoPaths {
  $output = Get-GitText -Arguments @("ls-files", "--others", "--exclude-standard")
  if ([string]::IsNullOrWhiteSpace($output)) {
    return @()
  }

  return @($output -split "\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Format-NativeArgument {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Argument)

  if ($Argument.Length -gt 0 -and $Argument -notmatch '[\s"]') {
    return $Argument
  }

  $builder = New-Object System.Text.StringBuilder
  [void] $builder.Append('"')
  $backslashes = 0

  foreach ($char in $Argument.ToCharArray()) {
    if ($char -eq '\') {
      $backslashes++
      continue
    }

    if ($char -eq '"') {
      [void] $builder.Append(('\' * (($backslashes * 2) + 1)))
      [void] $builder.Append('"')
      $backslashes = 0
      continue
    }

    if ($backslashes -gt 0) {
      [void] $builder.Append(('\' * $backslashes))
      $backslashes = 0
    }
    [void] $builder.Append($char)
  }

  if ($backslashes -gt 0) {
    [void] $builder.Append(('\' * ($backslashes * 2)))
  }
  [void] $builder.Append('"')

  return $builder.ToString()
}

function Join-NativeArguments {
  param([Parameter(Mandatory = $true)][string[]] $Arguments)
  return (($Arguments | ForEach-Object { Format-NativeArgument -Argument $_ }) -join " ")
}

function New-IterationPrompt {
  param([Parameter(Mandatory = $true)][int] $RunNumber)

  $axioms = Read-TextFile -Path $AxiomsPath
  $loopDoctrine = Read-TextFile -Path $LoopDoctrinePath
  $loopLog = Read-TextFile -Path $LoopLogPath
  $status = Get-GitStatusShort
  if ([string]::IsNullOrWhiteSpace($status)) {
    $status = "<clean>"
  }

  return @"
You are Codex running one canonical single-agent autonomous-loop iteration for michaelcrosato/salesforce-lite-crm.

Read and obey these operating references:

--- docs/AXIOMS.md ---
$axioms

--- docs/AGENT-LOOP.md ---
$loopDoctrine

--- docs/LOOP_LOG.md ---
$loopLog

Harness rules for this iteration:
- Run number: $RunNumber.
- Worktree: $RepoRoot.
- Do not commit, amend, tag, push, or merge. The PowerShell harness owns commits.
- Do not edit protected gate files, AXIOMS.md, AGENT-LOOP.md, package/config files, or scripts unless the human explicitly scopes that change.
- Do not use production credentials or perform irreversible live-world actions.
- Do not weaken or bypass scripts/local-gate.ps1.
- If progress stops, preserve useful evidence in docs/loop-artifacts following docs/AGENT-LOOP.md.
- Prefer one coherent, high-value repo-local change. Stop after one iteration and report what changed.

Current git status:
$status
"@
}

function Invoke-CodexIteration {
  param(
    [Parameter(Mandatory = $true)][string] $PromptPath,
    [Parameter(Mandatory = $true)][string] $OutputPath,
    [Parameter(Mandatory = $true)][string] $LastMessagePath,
    [Parameter(Mandatory = $true)][int] $TimeoutMinutes
  )

  $codex = Get-CodexExecutable
  $args = @(
    "exec",
    "--cd", $RepoRoot,
    "--output-last-message", $LastMessagePath,
    "--dangerously-bypass-approvals-and-sandbox",
    "-"
  )

  Write-Host ("Invoking: codex {0} < {1}" -f (Join-NativeArguments -Arguments $args), $PromptPath)
  Add-TextFileLine -Path $OutputPath -Text ("COMMAND: codex {0} < {1}" -f (Join-NativeArguments -Arguments $args), $PromptPath)

  $promptText = Read-TextFile -Path $PromptPath
  $promptBytes = [System.Text.Encoding]::UTF8.GetBytes($promptText)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $codex
  $psi.Arguments = Join-NativeArguments -Arguments $args
  $psi.WorkingDirectory = $RepoRoot
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi

  [void] $process.Start()
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()

  try {
    $process.StandardInput.BaseStream.Write($promptBytes, 0, $promptBytes.Length)
    $process.StandardInput.BaseStream.Flush()
  }
  finally {
    $process.StandardInput.Close()
  }

  $timeoutMs = [Math]::Max(1, $TimeoutMinutes) * 60 * 1000
  if (-not $process.WaitForExit($timeoutMs)) {
    try { $process.Kill() } catch {}
    throw "Codex iteration exceeded timeout of $TimeoutMinutes minute(s)."
  }

  $stdout = $stdoutTask.Result
  $stderr = $stderrTask.Result
  [System.IO.File]::AppendAllText($OutputPath, ($stdout + $stderr), (Get-Utf8NoBomEncoding))

  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    Write-Host $stdout
  }
  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    Write-Host $stderr
  }

  return $process.ExitCode
}

function New-ArtifactSlug {
  param([Parameter(Mandatory = $true)][string] $Status)
  $stamp = Get-Date -Format "yyyyMMdd-HHmm"
  return ("run-{0:D3}-{1}-codex-yolo-{2}" -f $script:RunNumber, $stamp, $Status)
}

function Save-FailedAttemptArtifact {
  param(
    [Parameter(Mandatory = $true)][string] $Status,
    [Parameter(Mandatory = $true)][string] $Wall,
    [Parameter(Mandatory = $true)][string] $Next
  )

  New-Item -ItemType Directory -Force -Path $ArtifactRoot | Out-Null
  $artifactDir = Join-Path $ArtifactRoot (New-ArtifactSlug -Status $Status)
  New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null

  $patchPath = Join-Path $artifactDir "attempt.patch"
  $notesPath = Join-Path $artifactDir "notes.md"
  $failurePath = Join-Path $artifactDir "failure.json"
  $statusPath = Join-Path $artifactDir "status.txt"
  $untrackedListPath = Join-Path $artifactDir "untracked-files.txt"
  $untrackedRoot = Join-Path $artifactDir "untracked"

  $script:LastSavedUntrackedPaths = @(Get-UntrackedRepoPaths)

  $diff = Get-GitText -Arguments @("diff", "--binary", "HEAD", "--")
  Write-TextFile -Path $patchPath -Text $diff
  Write-TextFile -Path $statusPath -Text ((Get-GitStatusShort) + [Environment]::NewLine)
  Write-TextFile -Path $untrackedListPath -Text (($script:LastSavedUntrackedPaths -join [Environment]::NewLine) + [Environment]::NewLine)

  foreach ($repoPath in $script:LastSavedUntrackedPaths) {
    if ($repoPath.Contains("..")) {
      throw "Refusing to preserve suspicious untracked path: $repoPath"
    }

    $sourcePath = Join-Path $RepoRoot ($repoPath -replace "/", [System.IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
      continue
    }

    $targetPath = Join-Path $untrackedRoot ($repoPath -replace "/", [System.IO.Path]::DirectorySeparatorChar)
    $targetParent = Split-Path -Parent $targetPath
    if ($targetParent) {
      New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
    }
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  }

  $notes = @"
## Run $("{0:D3}" -f $script:RunNumber)  $Status  codex-yolo
Intent: Run one canonical Codex autonomous-loop iteration.
Wall: $Wall
Tried: One Codex iteration followed by protected integrity and local gate validation.
Result: Stopped without a green validated commit.
Saved: $patchPath
Next: $Next
"@
  Write-TextFile -Path $notesPath -Text $notes

  $failure = [ordered]@{
    run = $script:RunNumber
    status = $Status
    wall = $Wall
    saved = $artifactDir
    next = $Next
    recordedAt = (Get-Date -Format o)
  }
  Write-TextFile -Path $failurePath -Text (($failure | ConvertTo-Json -Depth 4) + [Environment]::NewLine)

  return $artifactDir
}

function Remove-SavedUntrackedAttemptFiles {
  foreach ($repoPath in $script:LastSavedUntrackedPaths) {
    if ([string]::IsNullOrWhiteSpace($repoPath) -or $repoPath.Contains("..")) {
      continue
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot ($repoPath -replace "/", [System.IO.Path]::DirectorySeparatorChar)))
    if (-not $fullPath.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove untracked path outside repo: $repoPath"
    }

    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
      Remove-Item -LiteralPath $fullPath -Force
    }
  }
}

function Restore-LastGreenBase {
  if ([string]::IsNullOrWhiteSpace($script:LastGreenHead)) {
    throw "Cannot restore last green base because no last green HEAD is recorded."
  }

  Write-Host ("Restoring last green HEAD {0} after preserving the failed attempt." -f $script:LastGreenHead)
  Invoke-NativeCommand {
    & git -C $RepoRoot reset --hard $script:LastGreenHead
  }
  if ($script:LastNativeExitCode -ne 0) {
    throw "git reset --hard $script:LastGreenHead failed with exit code $script:LastNativeExitCode"
  }

  Remove-SavedUntrackedAttemptFiles
}

function Restore-AndRevalidateBase {
  param([Parameter(Mandatory = $true)][string] $Reason)

  Restore-LastGreenBase
  Invoke-RequiredScript -Label "base gate integrity after $Reason" -ScriptPath $AssertScript
  $baseGateExit = Invoke-LocalGate
  if ($baseGateExit -ne 0) {
    throw "Base local gate failed after restoring last green state; exit code $baseGateExit"
  }
}

function Add-LoopLogEntry {
  param(
    [Parameter(Mandatory = $true)][string] $Status,
    [Parameter(Mandatory = $true)][string] $Slug,
    [Parameter(Mandatory = $true)][string] $Objective,
    [Parameter(Mandatory = $true)][string] $Changed,
    [Parameter(Mandatory = $true)][string] $Gate,
    [Parameter(Mandatory = $true)][string] $CommitOrSaved,
    [string] $WhyStopped = "",
    [Parameter(Mandatory = $true)][string] $Next
  )

  Add-TextFileLine -Path $LoopLogPath -Text ""
  Add-TextFileLine -Path $LoopLogPath -Text ("## Run {0:D3}  {1}  {2}  {3}" -f $script:RunNumber, $Status, $Slug, (Get-Date -Format "yyyy-MM-dd HH:mm"))
  Add-TextFileLine -Path $LoopLogPath -Text "Objective: $Objective"
  Add-TextFileLine -Path $LoopLogPath -Text "Changed: $Changed"
  Add-TextFileLine -Path $LoopLogPath -Text "Gate: $Gate"
  Add-TextFileLine -Path $LoopLogPath -Text "Commit/Saved: $CommitOrSaved"
  if (-not [string]::IsNullOrWhiteSpace($WhyStopped)) {
    Add-TextFileLine -Path $LoopLogPath -Text "Why stopped: $WhyStopped"
  }
  Add-TextFileLine -Path $LoopLogPath -Text "Next: $Next"
}

function Invoke-LocalGate {
  $ps = Get-PowerShellExe
  Write-Host ""
  Write-Host "==> powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1"
  Invoke-NativeCommand {
    & $ps -NoLogo -NoProfile -ExecutionPolicy Bypass -File $LocalGateScript
  }
  return $script:LastNativeExitCode
}

function Commit-GreenWork {
  param([Parameter(Mandatory = $true)][string] $Message)

  $branch = Get-GitText -Arguments @("branch", "--show-current")
  if ($branch -ne "main") {
    throw "Live commit-to-main mode requires branch 'main'; current branch is '$branch'. No commit made."
  }

  $status = Get-GitStatusShort
  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No worktree changes to commit."
    return ""
  }

  Invoke-NativeCommand {
    & git -C $RepoRoot add --all
  }
  if ($script:LastNativeExitCode -ne 0) {
    throw "git add --all failed with exit code $script:LastNativeExitCode"
  }

  $protectedChanges = Get-GitText -Arguments @("diff", "--cached", "--name-only", "--", "docs/AXIOMS.md", "docs/AGENT-LOOP.md", "scripts/local-gate.ps1", "scripts/assert-gate-integrity.ps1", "scripts/run-codex-yolo-loop.ps1", "package.json", "package-lock.json", "tsconfig.json", "eslint.config.mjs", "vitest.config.ts", "playwright.config.ts", "prisma/schema.prisma", "prisma.config.ts")
  if (-not [string]::IsNullOrWhiteSpace($protectedChanges)) {
    throw "Refusing to commit protected path changes: $protectedChanges"
  }

  Invoke-NativeCommand {
    & git -C $RepoRoot commit -m $Message
  }
  if ($script:LastNativeExitCode -ne 0) {
    throw "git commit failed with exit code $script:LastNativeExitCode"
  }

  return (Get-GitText -Arguments @("rev-parse", "--short", "HEAD"))
}

Require-File -Path $AssertScript
Require-File -Path $LocalGateScript
Require-File -Path $AxiomsPath
Require-File -Path $LoopDoctrinePath
Require-File -Path $LoopLogPath
Require-Command "git" | Out-Null

if ($MaxIterations -lt 1) {
  throw "-MaxIterations must be at least 1."
}
if ($MaxRuntimeMinutes -lt 1) {
  throw "-MaxRuntimeMinutes must be at least 1."
}
if ($IterationTimeoutMinutes -lt 1) {
  throw "-IterationTimeoutMinutes must be at least 1."
}

$effectiveMaxIterations = if ($Once) { 1 } else { $MaxIterations }
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$script:RunNumber = 0

Push-Location $RepoRoot
try {
  Invoke-RequiredScript -Label "pre-run gate integrity" -ScriptPath $AssertScript

  if ($DryRun) {
    $summaryPath = Join-Path $RepoRoot "agent-runs\codex-yolo-loop\dry-run-final.md"
    $intendedArgs = @(
      "exec",
      "--cd", $RepoRoot,
      "--output-last-message", $summaryPath,
      "--dangerously-bypass-approvals-and-sandbox",
      "-"
    )

    Write-Host ""
    Write-Host "DRY RUN: no Codex invocation and no commit will occur."
    Write-Host ("DRY RUN: would run codex {0}" -f (Join-NativeArguments -Arguments $intendedArgs))
    Write-Host "DRY RUN: per-iteration prompt references docs/AXIOMS.md and docs/AGENT-LOOP.md."
    Write-Host "DRY RUN: validation sequence in live mode:"
    Write-Host "  1. powershell -ExecutionPolicy Bypass -File scripts/assert-gate-integrity.ps1"
    Write-Host "  2. codex exec --cd <repo> --output-last-message <file> --dangerously-bypass-approvals-and-sandbox -"
    Write-Host "  3. powershell -ExecutionPolicy Bypass -File scripts/assert-gate-integrity.ps1"
    Write-Host "  4. powershell -ExecutionPolicy Bypass -File scripts/local-gate.ps1"
    Write-Host "  5. commit on main only after integrity and local gate pass"

    Invoke-RequiredScript -Label "post-dry-run gate integrity" -ScriptPath $AssertScript
    exit 0
  }

  if (-not $Launch) {
    throw "Live mode requires -Launch. Use -DryRun for scaffold validation."
  }

  Require-MainBranchForLive
  Require-CleanWorktreeForLive
  $script:LastGreenHead = Get-GitText -Arguments @("rev-parse", "HEAD")
  Get-CodexExecutable | Out-Null

  for ($iteration = 1; $iteration -le $effectiveMaxIterations; $iteration++) {
    if ($stopwatch.Elapsed.TotalMinutes -ge $MaxRuntimeMinutes) {
      throw "MaxRuntimeMinutes fuse reached before iteration $iteration."
    }

    $script:RunNumber = $iteration
    $runDir = Join-Path $RepoRoot ("agent-runs\codex-yolo-loop\run-{0:D3}-{1}" -f $iteration, (Get-Date -Format "yyyyMMdd-HHmmss"))
    New-Item -ItemType Directory -Force -Path $runDir | Out-Null

    $promptPath = Join-Path $runDir "prompt.md"
    $outputPath = Join-Path $runDir "agent-output.log"
    $lastMessagePath = Join-Path $runDir "final.md"
    Write-TextFile -Path $promptPath -Text (New-IterationPrompt -RunNumber $iteration)

    $exitCode = Invoke-CodexIteration -PromptPath $promptPath -OutputPath $outputPath -LastMessagePath $lastMessagePath -TimeoutMinutes $IterationTimeoutMinutes
    if ($exitCode -ne 0) {
      $artifact = Save-FailedAttemptArtifact -Status "EXHAUSTED" -Wall "Codex exited with code $exitCode." -Next "Review Codex output before retrying."
      Restore-AndRevalidateBase -Reason "Codex non-zero exit"
      Add-LoopLogEntry -Status "EXHAUSTED" -Slug "codex-yolo" -Objective "Run one canonical Codex iteration." -Changed "- Codex exited non-zero." -Gate "not run" -CommitOrSaved $artifact -WhyStopped "Codex exited with code $exitCode." -Next "Review artifact and output logs."
      throw "Codex exited with code $exitCode. Saved artifact: $artifact"
    }

    try {
      Invoke-RequiredScript -Label "post-codex gate integrity" -ScriptPath $AssertScript
    }
    catch {
      $message = $_.Exception.Message
      $artifact = Save-FailedAttemptArtifact -Status "EXHAUSTED" -Wall "Protected gate integrity failed after Codex: $message" -Next "Human review required before retrying."
      Restore-AndRevalidateBase -Reason "protected integrity failure"
      Add-LoopLogEntry -Status "EXHAUSTED" -Slug "codex-yolo" -Objective "Run one canonical Codex iteration." -Changed "- Protected-file drift was preserved as an artifact." -Gate "failed at assert-gate-integrity.ps1" -CommitOrSaved $artifact -WhyStopped "Protected integrity failed." -Next "Human review required before retrying."
      throw "Post-Codex integrity failed. Saved artifact: $artifact. $message"
    }

    $gateExit = Invoke-LocalGate
    if ($gateExit -ne 0) {
      $artifact = Save-FailedAttemptArtifact -Status "EXHAUSTED" -Wall "Local gate failed with exit code $gateExit." -Next "Inspect gate output and artifact before retrying."
      Restore-AndRevalidateBase -Reason "local gate failure"
      Add-LoopLogEntry -Status "EXHAUSTED" -Slug "codex-yolo" -Objective "Run one canonical Codex iteration." -Changed "- Work preserved as an artifact." -Gate "failed at local-gate.ps1" -CommitOrSaved $artifact -WhyStopped "Protected local gate failed." -Next "Inspect artifact and repair without weakening the gate."
      throw "Local gate failed with exit code $gateExit. Saved artifact: $artifact"
    }

    $commit = Commit-GreenWork -Message ("[loop] run {0:D3}: codex yolo iteration" -f $iteration)
    if ([string]::IsNullOrWhiteSpace($commit)) {
      Add-LoopLogEntry -Status "GREEN" -Slug "codex-yolo" -Objective "Run one canonical Codex iteration." -Changed "- No worktree changes." -Gate "passed" -CommitOrSaved "none" -Next "Continue loop or choose a higher-value next move."
    } else {
      Add-LoopLogEntry -Status "GREEN" -Slug "codex-yolo" -Objective "Run one canonical Codex iteration." -Changed "- Committed validated work." -Gate "passed" -CommitOrSaved $commit -Next "Continue loop."
    }

    Commit-GreenWork -Message ("[loop] run {0:D3}: update loop log" -f $iteration) | Out-Null
    $script:LastGreenHead = Get-GitText -Arguments @("rev-parse", "HEAD")

    if ($Once) {
      break
    }
  }
}
finally {
  Pop-Location
}
