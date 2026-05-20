#requires -Version 5.1
[CmdletBinding()]
param(
  [switch]$Once,
  [switch]$DryRun,
  [switch]$Launch,
  [switch]$EnableRemoteStop,
  [int]$LoopIntervalSeconds = 900,
  [int]$HardTimeoutSeconds = 7200,
  [int]$HeartbeatTimeoutSeconds = 1200,
  [int]$SameCommandRepairCap = 3,
  [string]$RepoRoot     = "C:\dev\salesforce-lite-crm",
  [string]$LogRoot      = "C:\dev\salesforce-lite-agent-runs\logs",
  [string]$StatusRoot   = "C:\dev\salesforce-lite-agent-runs\status",
  [string]$PromptRoot   = "C:\dev\salesforce-lite-agent-runs\prompts"
)

# Default to dry-run if neither -DryRun nor -Launch was passed.
if (-not $Launch -and -not $DryRun) { $DryRun = $true }

$ErrorActionPreference = "Continue"

$Agents = @(
  @{ Name="codex";  Worktree="C:\dev\salesforce-lite-crm";        EnvVar="AUTONOMY_CODEX_CMD";  Prompt="prompts\shared\s4-f1-codex-demo-seed-tuning.md"; Feature="S4-F1" },
  @{ Name="claude"; Worktree="C:\dev\salesforce-lite-crm-claude"; EnvVar="AUTONOMY_CLAUDE_CMD"; Prompt="prompts\shared\s4-f2-claude-route-visual-qa.md"; Feature="S4-F2" },
  @{ Name="grok";   Worktree="C:\dev\salesforce-lite-crm-grok";   EnvVar="AUTONOMY_GROK_CMD";   Prompt="prompts\shared\s4-f3-grok-component-polish.md";  Feature="S4-F3" },
  @{ Name="gemini"; Worktree="C:\dev\salesforce-lite-crm-gemini"; EnvVar="AUTONOMY_GEMINI_CMD"; Prompt="prompts\shared\s4-f4-gemini-demo-smoke-gate.md";  Feature="S4-F4" }
)

# Section 5 shared/contract plus planning/decision zone files. The supervisor
# serializes the whole cycle when any queued prompt references one of these.
$SharedZoneGlobs = @(
  "prisma\schema.prisma", "prisma\schema.postgres.prisma", "prisma.config.ts",
  "lib\types\*", "CRM-CONTRACT.md", ".env.example", ".gitignore",
  "package.json", "package-lock.json",
  "next.config.mjs", "tsconfig.json", "postcss.config.mjs",
  "PLAN.md", "docs\decisions.md"
)

function Test-LocalStop { Test-Path (Join-Path $RepoRoot "STOP") }

function Test-RemoteStop {
  if (-not $EnableRemoteStop) { return $false }
  Push-Location $RepoRoot
  try {
    git fetch origin --quiet 2>$null | Out-Null
    $null = git show "origin/main:STOP" 2>$null
    return ($LASTEXITCODE -eq 0)
  } finally { Pop-Location }
}

function Test-PromptTouchesSharedZone {
  param([string]$PromptPath)
  if (-not (Test-Path $PromptPath)) { return $false }
  $c = Get-Content -Raw $PromptPath
  foreach ($g in $SharedZoneGlobs) { if ($c -like "*$g*") { return $true } }
  return $false
}

# Tree-kill: Windows-native, terminates PID and all descendants. Windows does
# not link parent/child lifetimes; killing only the wrapper leaves agent CLI
# children alive and spending tokens.
function Stop-ProcessTree {
  param([int]$ProcessId)
  if ($ProcessId -le 0) { return }
  try {
    & taskkill.exe /T /F /PID $ProcessId 2>$null | Out-Null
  } catch {
    # Best-effort fallback if taskkill unavailable.
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

# Snapshot the canonical prompt to an external file with the standard Track A
# invocation prepended. Decouples agent view from canonical file mid-run;
# canonical prompt files never need to include the invocation line.
function Write-PromptSnapshot {
  param([hashtable]$Agent, [string]$Stamp)
  $dayDir = Join-Path $PromptRoot (Get-Date -Format "yyyy-MM-dd")
  New-Item -ItemType Directory -Force -Path $dayDir | Out-Null
  $snapshotPath = Join-Path $dayDir "$($Agent.Name)-$Stamp.prompt.md"
  $canonicalPath = Join-Path $Agent.Worktree $Agent.Prompt
  $header = "Read PLAN.md and CRM-CONTRACT.md. Execute Sprint 4 Feature $($Agent.Feature). Begin.`n`n"
  $body = Get-Content -Raw $canonicalPath
  Set-Content -Path $snapshotPath -Value ($header + $body)
  return $snapshotPath
}

function Invoke-AgentBounded {
  param([hashtable]$Agent)
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $dayDir = Join-Path $LogRoot (Get-Date -Format "yyyy-MM-dd")
  New-Item -ItemType Directory -Force -Path $dayDir | Out-Null
  $stdoutLog = Join-Path $dayDir "$($Agent.Name)-$stamp.out.log"
  $stderrLog = Join-Path $dayDir "$($Agent.Name)-$stamp.err.log"
  $canonicalPrompt = Join-Path $Agent.Worktree $Agent.Prompt

  $cmdTemplate = [Environment]::GetEnvironmentVariable($Agent.EnvVar)
  if (-not $cmdTemplate) {
    "[$(Get-Date -Format o)] $($Agent.Name): env var $($Agent.EnvVar) not set; status=cli-not-configured" |
      Out-File -Append $stdoutLog
    return "cli-not-configured"
  }
  if (-not (Test-Path $canonicalPrompt)) {
    "[$(Get-Date -Format o)] $($Agent.Name): missing prompt $canonicalPrompt; status=missing-prompt" |
      Out-File -Append $stdoutLog
    return "missing-prompt"
  }

  # Write per-launch prompt snapshot with Track A header prepended. The
  # operator's pipeline reads from the snapshot, not the canonical file.
  $snapshotPath = Write-PromptSnapshot -Agent $Agent -Stamp $stamp

  # Substitute curly-brace placeholders. Curly braces avoid PowerShell variable
  # expansion if the operator set the env var with double quotes.
  # Example:
  #   $env:AUTONOMY_CODEX_CMD = 'Get-Content -Raw "{PROMPT_FILE}" | codex exec --sandbox workspace-write --ask-for-approval never --cd "{WORKTREE}" -'
  $expanded = $cmdTemplate.Replace('{PROMPT_FILE}', $snapshotPath).Replace('{WORKTREE}', $Agent.Worktree)

  if ($DryRun) {
    "[$(Get-Date -Format o)] $($Agent.Name): DRY-RUN would invoke pipeline: $expanded" |
      Out-File -Append $stdoutLog
    "[$(Get-Date -Format o)] $($Agent.Name): snapshot at $snapshotPath" |
      Out-File -Append $stdoutLog
    return "dry-run"
  }

  $proc = Start-Process -FilePath "powershell" `
    -ArgumentList @("-NoProfile","-NonInteractive","-Command",$expanded) `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError  $stderrLog `
    -PassThru -NoNewWindow

  $deadline = (Get-Date).AddSeconds($HardTimeoutSeconds)
  while (-not $proc.HasExited) {
    Start-Sleep -Seconds 30
    if ((Get-Date) -ge $deadline) {
      "[$(Get-Date -Format o)] $($Agent.Name): hard timeout - tree-killing PID $($proc.Id)" |
        Out-File -Append $stderrLog
      Stop-ProcessTree -ProcessId $proc.Id
      return "hard-timeout"
    }
    if (Test-Path $stdoutLog) {
      $age = ((Get-Date) - (Get-Item $stdoutLog).LastWriteTime).TotalSeconds
      if ($age -gt $HeartbeatTimeoutSeconds) {
        "[$(Get-Date -Format o)] $($Agent.Name): heartbeat timeout - tree-killing PID $($proc.Id)" |
          Out-File -Append $stderrLog
        Stop-ProcessTree -ProcessId $proc.Id
        return "heartbeat-timeout"
      }
    }
  }
  return "exit-$($proc.ExitCode)"
}

function Write-Status {
  param([hashtable[]]$AgentsState)
  New-Item -ItemType Directory -Force -Path $StatusRoot | Out-Null
  $json = $AgentsState | ConvertTo-Json -Depth 4
  Set-Content -Path (Join-Path $StatusRoot "latest.json") -Value $json
  $md = @("# Fleet Status", "Updated: $(Get-Date -Format o)", "")
  foreach ($a in $AgentsState) {
    $md += "## $($a.Name)"
    $md += "- Worktree: $($a.Worktree)"
    $md += "- Last status: $($a.Status)"
    $md += "- Active blockers: $($a.BlockerCount)"
    $md += ""
  }
  Set-Content -Path (Join-Path $StatusRoot "latest.md") -Value ($md -join "`n")
}

do {
  if (Test-LocalStop) {
    Write-Host "[$(Get-Date -Format o)] Local STOP detected. Exiting."
    break
  }
  if (Test-RemoteStop) {
    Write-Host "[$(Get-Date -Format o)] Remote STOP on origin/main detected. Exiting."
    break
  }

  # Shared-zone serialization: if any queued prompt touches a section 5 shared
  # or planning zone file, run that agent alone this cycle.
  $serialize = $false
  foreach ($a in $Agents) {
    if (Test-PromptTouchesSharedZone -PromptPath (Join-Path $a.Worktree $a.Prompt)) {
      $serialize = $true; break
    }
  }
  $cycle = if ($serialize) { @($Agents[0]) } else { $Agents }

  $cycleState = @()
  foreach ($a in $cycle) {
    if (-not (Test-Path $a.Worktree)) {
      $cycleState += @{ Name=$a.Name; Worktree=$a.Worktree; Status="missing-worktree"; BlockerCount=0 }
      continue
    }
    Push-Location $a.Worktree
    $dirty = (git status --short) -ne $null
    $branch = (git branch --show-current).Trim()
    Pop-Location
    if ($dirty) {
      $cycleState += @{ Name=$a.Name; Worktree=$a.Worktree; Status="dirty-worktree"; BlockerCount=0 }
      continue
    }
    if ($branch -eq "main") {
      $cycleState += @{ Name=$a.Name; Worktree=$a.Worktree; Status="unsafe-branch-main"; BlockerCount=0 }
      continue
    }
    # Branch-prefix sanity: refuse to launch if branch is not on this agent's
    # ownership prefix (codex/, claude/, grok/, gemini/).
    if (-not $branch.StartsWith("$($a.Name)/")) {
      $cycleState += @{ Name=$a.Name; Worktree=$a.Worktree; Status="unsafe-branch-prefix:$branch"; BlockerCount=0 }
      continue
    }

    $status = Invoke-AgentBounded -Agent $a
    $cycleState += @{ Name=$a.Name; Worktree=$a.Worktree; Status=$status; BlockerCount=0 }
  }

  Write-Status -AgentsState $cycleState

  if ($Once) { break }
  Start-Sleep -Seconds $LoopIntervalSeconds
} while ($true)
