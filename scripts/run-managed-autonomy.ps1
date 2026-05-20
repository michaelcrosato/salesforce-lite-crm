#requires -Version 5.1
[CmdletBinding()]
param(
  [ValidateSet("DryRun","FailSafe","MaxAutonomy","ReviewOnly")]
  [string]$Mode = "DryRun",
  [switch]$Once,
  [switch]$Launch,
  [switch]$EnableRemoteStop,
  [int]$LoopIntervalSeconds = 900,
  [int]$HardTimeoutSeconds = 7200,
  [int]$HeartbeatTimeoutSeconds = 1200,
  [string]$RepoRoot = "C:\dev\salesforce-lite-crm",
  [string]$RunsRoot = "C:\dev\salesforce-lite-agent-runs",
  [string]$QueuePath = "C:\dev\salesforce-lite-agent-runs\queue\autonomy-queue.json"
)

$ErrorActionPreference = "Continue"
if (-not $Launch) { $Mode = "DryRun" }

$LogRoot      = Join-Path $RunsRoot "logs"
$StatusRoot   = Join-Path $RunsRoot "status"
$PromptRoot   = Join-Path $RunsRoot "prompts"
$DispatchRoot = Join-Path $RunsRoot "dispatch"
$HandoffRoot  = Join-Path $RunsRoot "handoffs"
$IftRoot      = Join-Path $RunsRoot "ift-proposals"
$QueueRoot    = Join-Path $RunsRoot "queue"

$ModeConfig = @{
  DryRun      = @{ MaxWorkers = 0; AllowWorkers = $false; AllowFailover = $false; AllowIft = $false; ReviewerOnly = $false }
  ReviewOnly  = @{ MaxWorkers = 4; AllowWorkers = $true;  AllowFailover = $false; AllowIft = $false; ReviewerOnly = $true  }
  FailSafe    = @{ MaxWorkers = 2; AllowWorkers = $true;  AllowFailover = $true;  AllowIft = $true;  ReviewerOnly = $false }
  MaxAutonomy = @{ MaxWorkers = 4; AllowWorkers = $true;  AllowFailover = $true;  AllowIft = $true;  ReviewerOnly = $false }
}
$Cfg = $ModeConfig[$Mode]

$AgentEnv = @{
  codex  = "AUTONOMY_CODEX_CMD"
  claude = "AUTONOMY_CLAUDE_CMD"
  grok   = "AUTONOMY_GROK_CMD"
  gemini = "AUTONOMY_GEMINI_CMD"
}

$ReviewEnv = @{
  codex  = "AUTONOMY_CODEX_REVIEW_CMD"
  claude = "AUTONOMY_CLAUDE_REVIEW_CMD"
  grok   = "AUTONOMY_GROK_REVIEW_CMD"
  gemini = "AUTONOMY_GEMINI_REVIEW_CMD"
}

$AgentWorktrees = @{
  codex  = "C:\dev\salesforce-lite-crm"
  claude = "C:\dev\salesforce-lite-crm-claude"
  grok   = "C:\dev\salesforce-lite-crm-grok"
  gemini = "C:\dev\salesforce-lite-crm-gemini"
}

$QuotaPatterns = @(
  "usage limit",
  "rate limit",
  "429",
  "quota exceeded",
  "try again later",
  "try again in",
  "session limit",
  "credit exhausted",
  "extra usage disabled",
  "temporarily unavailable",
  "overloaded",
  "RESOURCE_EXHAUSTED",
  "login required",
  "authentication expired"
)

function Ensure-RuntimeDirs {
  foreach ($p in @($RunsRoot,$LogRoot,$StatusRoot,$PromptRoot,$DispatchRoot,$HandoffRoot,$IftRoot,$QueueRoot)) {
    New-Item -ItemType Directory -Force -Path $p | Out-Null
  }
}

function Write-ManagerLog {
  param([string]$Message)
  Ensure-RuntimeDirs
  "[$(Get-Date -Format o)] $Message" | Out-File -Append (Join-Path $LogRoot "manager.log")
}

function Send-Notify {
  param([string]$Title, [string]$Body)
  $url = [Environment]::GetEnvironmentVariable("AUTONOMY_NOTIFY_URL")
  if (-not $url) { return }
  try {
    Invoke-RestMethod -Uri $url -Method Post -Body $Body -Headers @{ "Title" = $Title } -TimeoutSec 10 | Out-Null
  } catch {
    Write-ManagerLog "notification failed: $($_.Exception.Message)"
  }
}

function Test-R8Precondition {
  $scriptPath = Join-Path $RepoRoot "scripts\run-autonomous-loop.ps1"
  $planPath = Join-Path $RepoRoot "PLAN.md"
  if (-not (Test-Path $scriptPath)) { return "missing scripts/run-autonomous-loop.ps1" }
  if (-not (Test-Path $planPath)) { return "missing PLAN.md" }

  $plan = Get-Content -Raw $planPath
  foreach ($needle in @("STOP","repair cap","Sprint quiescence")) {
    if ($plan -notmatch [regex]::Escape($needle)) { return "PLAN.md missing R8 rule: $needle" }
  }

  foreach ($prompt in @(
    "prompts\shared\s4-f1-codex-demo-seed-tuning.md",
    "prompts\shared\s4-f2-claude-route-visual-qa.md",
    "prompts\shared\s4-f3-grok-component-polish.md",
    "prompts\shared\s4-f4-gemini-demo-smoke-gate.md"
  )) {
    if (-not (Test-Path (Join-Path $RepoRoot $prompt))) { return "missing R8 Sprint 4 prompt: $prompt" }
  }

  return $null
}

function Test-LocalStop {
  return (Test-Path (Join-Path $RepoRoot "STOP"))
}

function Test-RemoteStop {
  if (-not $EnableRemoteStop) { return $false }
  Push-Location $RepoRoot
  try {
    git fetch origin --quiet 2>$null | Out-Null
    $null = git show "origin/main:STOP" 2>$null
    return ($LASTEXITCODE -eq 0)
  } finally {
    Pop-Location
  }
}

function Stop-ProcessTree {
  param([int]$ProcessId)
  if ($ProcessId -le 0) { return }
  try {
    & taskkill.exe /T /F /PID $ProcessId 2>$null | Out-Null
  } catch {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function ConvertFrom-ManagerJson {
  param([string]$Raw)
  if (-not $Raw) { throw "empty manager output" }
  try {
    return ($Raw | ConvertFrom-Json)
  } catch {
    $clean = $Raw -replace '^\s*```json\s*','' -replace '^\s*```\s*','' -replace '\s*```\s*$',''
    $clean = $clean -replace ',(\s*[}\]])','$1'
    return ($clean | ConvertFrom-Json)
  }
}

function Invoke-BoundedPipeline {
  param(
    [string]$ExpandedCommand,
    [string]$StdoutLog,
    [string]$StderrLog,
    [int]$TimeoutSeconds = 900
  )

  $proc = Start-Process -FilePath "powershell" `
    -ArgumentList @("-NoProfile","-NonInteractive","-Command",$ExpandedCommand) `
    -RedirectStandardOutput $StdoutLog `
    -RedirectStandardError $StderrLog `
    -PassThru -NoNewWindow

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while (-not $proc.HasExited) {
    Start-Sleep -Seconds 5
    if ((Get-Date) -ge $deadline) {
      "[$(Get-Date -Format o)] bounded pipeline timeout - tree-killing PID $($proc.Id)" | Out-File -Append $StderrLog
      Stop-ProcessTree -ProcessId $proc.Id
      return "timeout"
    }
  }
  return "exit-$($proc.ExitCode)"
}

function Initialize-Queue {
  Ensure-RuntimeDirs
  if (Test-Path $QueuePath) { return }
  $example = Join-Path $RepoRoot "docs\autonomy\queue.example.json"
  if (-not (Test-Path $example)) { throw "missing queue.example.json: $example" }
  Copy-Item -Path $example -Destination $QueuePath -Force
}

function Get-QueueObject {
  Initialize-Queue
  return (Get-Content -Raw $QueuePath | ConvertFrom-Json)
}

function Save-QueueObject {
  param([object]$Queue)
  $Queue | ConvertTo-Json -Depth 12 | Set-Content -Path $QueuePath
}

function Get-QueueTask {
  param([object]$Queue, [string]$TaskId)
  foreach ($t in @($Queue.tasks)) {
    if ($t.id -eq $TaskId) { return $t }
  }
  return $null
}

function Update-QueueTaskStatus {
  param([string]$TaskId, [string]$Status, [string]$Reason)
  try {
    $q = Get-QueueObject
    $t = Get-QueueTask -Queue $q -TaskId $TaskId
    if (-not $t) { return }
    $t.status = $Status
    if ($t.PSObject.Properties.Name -contains "last_status_reason") { $t.last_status_reason = $Reason }
    else { $t | Add-Member -NotePropertyName "last_status_reason" -NotePropertyValue $Reason }
    if ($t.PSObject.Properties.Name -contains "updated_at") { $t.updated_at = (Get-Date -Format o) }
    else { $t | Add-Member -NotePropertyName "updated_at" -NotePropertyValue (Get-Date -Format o) }
    Save-QueueObject -Queue $q
  } catch {
    Write-ManagerLog "queue update failed for ${TaskId}: $($_.Exception.Message)"
  }
}

function Get-ModelAvailability {
  Ensure-RuntimeDirs
  $path = Join-Path $StatusRoot "model-availability.json"
  if (Test-Path $path) {
    $availability = Get-Content -Raw $path | ConvertFrom-Json
  } else {
    $availability = [pscustomobject]@{}
  }

  foreach ($agent in @("codex","claude","grok","gemini")) {
    if (-not ($availability.PSObject.Properties.Name -contains $agent)) {
      $availability | Add-Member -NotePropertyName $agent -NotePropertyValue ([pscustomobject]@{
        available = $true
        unavailable_until = $null
        reason = $null
      })
    }

    $until = $availability.$agent.unavailable_until
    if ($until) {
      try {
        if ([datetime]$until -lt (Get-Date)) {
          $availability.$agent.available = $true
          $availability.$agent.unavailable_until = $null
          $availability.$agent.reason = $null
        }
      } catch {}
    }
  }

  $availability | ConvertTo-Json -Depth 6 | Set-Content -Path $path
  return $availability
}

function Set-ModelUnavailable {
  param([string]$Agent, [string]$Reason, [int]$Minutes = 60)
  $availability = Get-ModelAvailability
  $value = [pscustomobject]@{
    available = $false
    unavailable_until = (Get-Date).AddMinutes($Minutes).ToString("o")
    reason = $Reason
  }
  $availability | Add-Member -NotePropertyName $Agent -NotePropertyValue $value -Force
  $availability | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $StatusRoot "model-availability.json")
}

function Get-RecentHandoffsJson {
  if (-not (Test-Path $HandoffRoot)) { return "[]" }
  $files = Get-ChildItem -Path $HandoffRoot -Recurse -Filter "handoff.json" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 10
  $items = @()
  foreach ($f in $files) {
    try { $items += (Get-Content -Raw $f.FullName | ConvertFrom-Json) } catch {}
  }
  return ($items | ConvertTo-Json -Depth 8)
}

function Test-OutputForQuota {
  param([string[]]$Paths)
  foreach ($path in $Paths) {
    if (-not (Test-Path $path)) { continue }
    $text = (Get-Content -Path $path -Tail 200 -ErrorAction SilentlyContinue) -join "`n"
    foreach ($pat in $QuotaPatterns) {
      if ($text -match [regex]::Escape($pat)) { return $pat }
    }
  }
  return $null
}

function Get-GitHead {
  param([string]$Worktree)
  Push-Location $Worktree
  try {
    return (git rev-parse HEAD 2>$null).Trim()
  } finally {
    Pop-Location
  }
}

function Get-ChangedFilesSince {
  param([string]$Worktree, [string]$BaseSha)

  if (-not (Test-Path $Worktree)) { return @() }

  Push-Location $Worktree
  try {
    $files = @()
    if ($BaseSha) { $files += git diff --name-only "$BaseSha..HEAD" 2>$null }
    $status = git status --short 2>$null
    if ($status) {
      $files += @($status | ForEach-Object {
        $line = $_.ToString()
        if ($line.Length -gt 3) {
          $path = $line.Substring(3).Trim()
          if ($path -match '\s->\s(.+)$') { $matches[1] } else { $path }
        }
      })
    }
    return @($files | Where-Object { $_ -and $_.Length -gt 0 } | Sort-Object -Unique)
  } finally {
    Pop-Location
  }
}

function Test-ChangedFilesWithinAllowedZones {
  param([string[]]$ChangedFiles, [string[]]$AllowedZones)
  $violations = @()

  foreach ($file in $ChangedFiles) {
    $normFile = $file -replace '\\','/'
    $matched = $false

    foreach ($zone in $AllowedZones) {
      $normZone = $zone -replace '\\','/'
      $pattern = $normZone -replace '/\*\*$','/*' -replace '\*\*/','*/'

      if ($normFile -eq $normZone) { $matched = $true; break }
      if ($normFile -like $pattern) { $matched = $true; break }
      if ($pattern -notmatch '\*' -and $normFile -like "$pattern/*") { $matched = $true; break }
    }

    if (-not $matched) { $violations += $file }
  }

  return $violations
}

function Test-ZonesOverlap {
  param([string[]]$A, [string[]]$B)
  foreach ($a in $A) {
    $aa = ($a -replace '\\','/').TrimEnd('*').TrimEnd('/')
    foreach ($b in $B) {
      $bb = ($b -replace '\\','/').TrimEnd('*').TrimEnd('/')
      if ($aa -eq $bb -or $aa.StartsWith($bb) -or $bb.StartsWith($aa)) { return $true }
    }
  }
  return $false
}

function Test-ArraySameMembers {
  param([object[]]$A, [object[]]$B)
  $aa = @($A | ForEach-Object { $_.ToString() } | Sort-Object)
  $bb = @($B | ForEach-Object { $_.ToString() } | Sort-Object)
  if ($aa.Count -ne $bb.Count) { return $false }
  for ($i = 0; $i -lt $aa.Count; $i++) {
    if ($aa[$i] -ne $bb[$i]) { return $false }
  }
  return $true
}

function Test-DispatchEntry {
  param([object]$Entry, [object]$Queue)

  foreach ($field in @("task_id","agent","role","worktree","branch","prompt_template","allowed_zones","gate","max_attempts")) {
    if (-not ($Entry.PSObject.Properties.Name -contains $field)) { return "missing field: $field" }
  }

  if ($Entry.agent -notin @("codex","claude","grok","gemini")) { return "unknown agent: $($Entry.agent)" }
  if ($Entry.role -notin @("worker","reviewer")) { return "unknown role: $($Entry.role)" }
  if ($Cfg.ReviewerOnly -and $Entry.role -ne "reviewer") { return "ReviewOnly mode rejects worker dispatch" }

  $task = Get-QueueTask -Queue $Queue -TaskId $Entry.task_id
  if (-not $task) { return "task not present in queue: $($Entry.task_id)" }
  if ($task.status -notin @("queued","active")) { return "task not launchable: $($Entry.task_id) status=$($task.status)" }

  $allowedAgents = if ($Entry.role -eq "reviewer") { @($task.review_agents) } else { @($task.preferred_agents) + @($task.fallback_agents) }
  if ($Entry.agent -notin $allowedAgents) { return "agent not allowed for task/role: $($Entry.agent) / $($Entry.task_id)" }

  if (-not (Test-ArraySameMembers -A @($Entry.allowed_zones) -B @($task.allowed_zones))) { return "allowed_zones mismatch with queue for $($Entry.task_id)" }
  if (-not (Test-ArraySameMembers -A @($Entry.gate) -B @($task.gate))) { return "gate mismatch with queue for $($Entry.task_id)" }

  if (-not $Entry.branch.StartsWith("$($Entry.agent)/")) { return "branch prefix mismatch: $($Entry.branch)" }
  if ($Entry.branch -eq "main") { return "refuses main branch dispatch" }

  $expectedWorktree = $AgentWorktrees[$Entry.agent]
  if ($expectedWorktree -and ($Entry.worktree -ne $expectedWorktree)) { return "worktree mismatch for $($Entry.agent): $($Entry.worktree)" }
  if (-not (Test-Path $Entry.worktree)) { return "missing worktree: $($Entry.worktree)" }
  if (-not (Test-Path (Join-Path $Entry.worktree $Entry.prompt_template))) { return "missing prompt_template: $($Entry.prompt_template)" }
  if ([int]$Entry.max_attempts -lt 1 -or [int]$Entry.max_attempts -gt 3) { return "max_attempts must be 1..3" }

  Push-Location $Entry.worktree
  try {
    $branch = (git branch --show-current).Trim()
    $dirty = (git status --short) -ne $null
    if ($dirty) { return "dirty worktree: $($Entry.worktree)" }
    if ($branch -eq "main") { return "unsafe branch main in $($Entry.worktree)" }
    if (-not $branch.StartsWith("$($Entry.agent)/")) { return "unsafe branch prefix in worktree: $branch" }
  } finally {
    Pop-Location
  }

  return $null
}

function Test-DispatchFull {
  param([object]$Dispatch, [object]$Queue)
  $valid = @()
  $rejected = @()

  if (-not $Dispatch) { return @{ Valid=@(); Rejected=@(@{ reason="null dispatch" }) } }
  if ($Dispatch.schema_version -ne 1) { return @{ Valid=@(); Rejected=@(@{ reason="bad schema_version" }) } }

  $entries = @($Dispatch.dispatch)
  if ($entries.Count -gt $Cfg.MaxWorkers) { $entries = $entries | Select-Object -First $Cfg.MaxWorkers }

  foreach ($entry in $entries) {
    $err = Test-DispatchEntry -Entry $entry -Queue $Queue
    if ($err) {
      $rejected += @{ task_id=$entry.task_id; agent=$entry.agent; reason=$err }
      continue
    }

    $conflict = $false
    foreach ($kept in $valid) {
      if (Test-ZonesOverlap -A @($entry.allowed_zones) -B @($kept.allowed_zones)) {
        if (-not [bool]$entry.parallel_safe -or -not [bool]$kept.parallel_safe) {
          $rejected += @{ task_id=$entry.task_id; agent=$entry.agent; reason="parallel-conflict with $($kept.task_id)" }
          $conflict = $true
          break
        }
      }
    }

    if (-not $conflict) { $valid += $entry }
  }

  return @{ Valid=$valid; Rejected=$rejected }
}

function Write-PromptSnapshot {
  param([object]$Entry, [string]$CycleId)
  $dir = Join-Path $PromptRoot $CycleId
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  $path = Join-Path $dir "$($Entry.agent)-$($Entry.task_id).prompt.md"
  $canonical = Join-Path $Entry.worktree $Entry.prompt_template
  $body = Get-Content -Raw $canonical
  $header = "Read PLAN.md and CRM-CONTRACT.md. Execute task $($Entry.task_id). Begin.`n`n"
  Set-Content -Path $path -Value ($header + $body)
  return $path
}

function Build-ManagerPrompt {
  param([string]$CycleId)
  $dir = Join-Path $DispatchRoot $CycleId
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  $managerPrompt = Get-Content -Raw (Join-Path $RepoRoot "prompts\manager\r9-dispatch-manager.md")
  $queue = Get-Content -Raw $QueuePath
  $plan = Get-Content -Raw (Join-Path $RepoRoot "PLAN.md")
  $contract = Get-Content -Raw (Join-Path $RepoRoot "CRM-CONTRACT.md")
  $latestStatus = if (Test-Path (Join-Path $StatusRoot "latest.json")) { Get-Content -Raw (Join-Path $StatusRoot "latest.json") } else { "{}" }
  $availability = (Get-ModelAvailability | ConvertTo-Json -Depth 8)
  $handoffs = Get-RecentHandoffsJson

  $text = @"
$managerPrompt

=== MODE ===
$Mode

=== MAX_WORKERS ===
$($Cfg.MaxWorkers)

=== PLAN.md ===
$plan

=== CRM-CONTRACT.md ===
$contract

=== autonomy-queue.json ===
$queue

=== model-availability.json ===
$availability

=== recent-handoffs.json ===
$handoffs

=== status/latest.json ===
$latestStatus

Emit dispatch JSON now. JSON only.
"@

  $promptPath = Join-Path $dir "manager-prompt.md"
  Set-Content -Path $promptPath -Value $text
  return $promptPath
}

function Invoke-ManagerCycle {
  param([string]$CycleId)
  $cmdTemplate = [Environment]::GetEnvironmentVariable("AUTONOMY_MANAGER_CMD")
  if (-not $cmdTemplate) {
    Write-ManagerLog "AUTONOMY_MANAGER_CMD not set"
    return $null
  }

  $dir = Join-Path $DispatchRoot $CycleId
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  $promptPath = Build-ManagerPrompt -CycleId $CycleId
  $outputFile = Join-Path $dir "dispatch.raw.txt"
  $stdoutLog = Join-Path $dir "manager.stdout.log"
  $stderrLog = Join-Path $dir "manager.stderr.log"

  $expanded = $cmdTemplate.Replace("{PROMPT_FILE}", $promptPath).Replace("{WORKTREE}", $RepoRoot).Replace("{OUTPUT_FILE}", $outputFile)
  $status = Invoke-BoundedPipeline -ExpandedCommand $expanded -StdoutLog $stdoutLog -StderrLog $stderrLog -TimeoutSeconds 900
  if ($status -ne "exit-0") {
    Write-ManagerLog "manager failed: $status"
    return $null
  }

  $raw = if (Test-Path $outputFile) { Get-Content -Raw $outputFile } else { Get-Content -Raw $stdoutLog }
  try {
    $parsed = ConvertFrom-ManagerJson -Raw $raw
    $parsed | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $dir "dispatch.json")
    return $parsed
  } catch {
    Write-ManagerLog "manager JSON parse failed: $($_.Exception.Message)"
    $raw | Set-Content -Path (Join-Path $dir "dispatch.invalid.txt")
    return $null
  }
}

function Start-WorkerProcess {
  param([object]$Entry, [string]$CycleId)

  $envName = if ($Entry.role -eq "reviewer") { $ReviewEnv[$Entry.agent] } else { $AgentEnv[$Entry.agent] }
  $cmdTemplate = [Environment]::GetEnvironmentVariable($envName)

  $dir = Join-Path $LogRoot $CycleId
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  $stdoutLog = Join-Path $dir "$($Entry.agent)-$($Entry.task_id).out.log"
  $stderrLog = Join-Path $dir "$($Entry.agent)-$($Entry.task_id).err.log"

  if (-not $cmdTemplate) {
    $status = if ($Entry.role -eq "reviewer") { "review-cli-not-configured" } else { "cli-not-configured" }
    return [pscustomobject]@{ Entry=$Entry; Status=$status; Stdout=$stdoutLog; Stderr=$stderrLog; Process=$null; BeforeHead=$null }
  }

  $beforeHead = Get-GitHead -Worktree $Entry.worktree
  $snapshot = Write-PromptSnapshot -Entry $Entry -CycleId $CycleId
  $expanded = $cmdTemplate.Replace("{PROMPT_FILE}", $snapshot).Replace("{WORKTREE}", $Entry.worktree).Replace("{OUTPUT_FILE}", (Join-Path $dir "$($Entry.agent)-$($Entry.task_id).final.txt"))

  if ($Mode -eq "DryRun" -or -not $Cfg.AllowWorkers) {
    "DRY-RUN would invoke: $expanded" | Set-Content -Path $stdoutLog
    return [pscustomobject]@{ Entry=$Entry; Status="dry-run"; Stdout=$stdoutLog; Stderr=$stderrLog; Process=$null; BeforeHead=$beforeHead; Snapshot=$snapshot }
  }

  Update-QueueTaskStatus -TaskId $Entry.task_id -Status "active" -Reason "launched $($Entry.agent) $($Entry.role)"

  $proc = Start-Process -FilePath "powershell" `
    -ArgumentList @("-NoProfile","-NonInteractive","-Command",$expanded) `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru -NoNewWindow

  return [pscustomobject]@{
    Entry=$Entry
    Status="running"
    Stdout=$stdoutLog
    Stderr=$stderrLog
    Process=$proc
    Deadline=(Get-Date).AddSeconds($HardTimeoutSeconds)
    Snapshot=$snapshot
    BeforeHead=$beforeHead
  }
}

function Monitor-Workers {
  param([object[]]$Workers)

  while (($Workers | Where-Object { $_.Status -eq "running" }).Count -gt 0) {
    foreach ($w in $Workers) {
      if ($w.Status -ne "running") { continue }

      $quota = Test-OutputForQuota -Paths @($w.Stdout,$w.Stderr)
      if ($quota) {
        Stop-ProcessTree -ProcessId $w.Process.Id
        $w.Status = "quota-hit"
        Set-ModelUnavailable -Agent $w.Entry.agent -Reason $quota -Minutes 60
        Send-Notify -Title "R9 quota/auth hit: $($w.Entry.agent)" -Body "$($w.Entry.task_id): $quota"
        continue
      }

      if ((Get-Date) -gt $w.Deadline) {
        Stop-ProcessTree -ProcessId $w.Process.Id
        $w.Status = "hard-timeout"
        Send-Notify -Title "R9 hard timeout: $($w.Entry.agent)" -Body "$($w.Entry.task_id)"
        continue
      }

      $latestWrite = Get-Date "1970-01-01"
      foreach ($p in @($w.Stdout,$w.Stderr)) {
        if (Test-Path $p) {
          $lw = (Get-Item $p).LastWriteTime
          if ($lw -gt $latestWrite) { $latestWrite = $lw }
        }
      }

      if (((Get-Date) - $latestWrite).TotalSeconds -gt $HeartbeatTimeoutSeconds) {
        Stop-ProcessTree -ProcessId $w.Process.Id
        $w.Status = "heartbeat-timeout"
        Send-Notify -Title "R9 heartbeat timeout: $($w.Entry.agent)" -Body "$($w.Entry.task_id)"
        continue
      }

      $w.Process.Refresh()
      if ($w.Process.HasExited) {
        $w.Status = "exit-$($w.Process.ExitCode)"
      }
    }

    Start-Sleep -Seconds 20
  }

  return $Workers
}

function Write-Handoff {
  param([object]$Worker, [string]$FailureType, [string[]]$ChangedFiles, [string[]]$Violations)

  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $dir = Join-Path $HandoffRoot "$($Worker.Entry.task_id)-$($Worker.Entry.agent)-$stamp"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  $diffPath = Join-Path $dir "diff.patch"
  Push-Location $Worker.Entry.worktree
  try {
    if ($Worker.BeforeHead) {
      git diff --no-ext-diff "$($Worker.BeforeHead)..HEAD" | Set-Content -Path $diffPath
    } else {
      git diff --no-ext-diff | Set-Content -Path $diffPath
    }
  } finally {
    Pop-Location
  }

  $json = [pscustomobject]@{
    schema_version = 1
    task_id = $Worker.Entry.task_id
    from_agent = $Worker.Entry.agent
    failure_type = $FailureType
    failed_command = $null
    exit_code = $null
    attempt = 1
    captured_at = (Get-Date -Format o)
    changed_files = @($ChangedFiles)
    zone_violations = @($Violations)
    diff_path = $diffPath
    stdout_log = $Worker.Stdout
    stderr_log = $Worker.Stderr
    recommended_next_agents = @($Worker.Entry.fallback_agents)
    supervisor_recommendation = if ($FailureType -eq "validation") { "park" } elseif ($Cfg.AllowFailover) { "transfer" } else { "stop" }
  }

  $json | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $dir "handoff.json")
  Set-Content -Path (Join-Path $dir "handoff.md") -Value (@(
    "# Handoff",
    "Task: $($Worker.Entry.task_id)",
    "From agent: $($Worker.Entry.agent)",
    "Failure type: $FailureType",
    "Status: $($Worker.Status)",
    "Changed files: $($ChangedFiles -join ', ')",
    "Zone violations: $($Violations -join ', ')",
    "Recommendation: $($json.supervisor_recommendation)"
  ) -join "`n")

  if ($json.supervisor_recommendation -eq "park") {
    Update-QueueTaskStatus -TaskId $Worker.Entry.task_id -Status "blocked" -Reason "$FailureType via $($Worker.Entry.agent)"
  } else {
    Update-QueueTaskStatus -TaskId $Worker.Entry.task_id -Status "queued" -Reason "$FailureType via $($Worker.Entry.agent); handoff created"
  }

  return $dir
}

function Invoke-PostRunValidation {
  param([object]$Worker)

  if ($Worker.Status -ne "exit-0") { return $Worker }

  $changed = Get-ChangedFilesSince -Worktree $Worker.Entry.worktree -BaseSha $Worker.BeforeHead
  if ($changed.Count -eq 0) {
    Update-QueueTaskStatus -TaskId $Worker.Entry.task_id -Status "done" -Reason "exit-0; no changed files"
    return $Worker
  }

  $violations = Test-ChangedFilesWithinAllowedZones -ChangedFiles $changed -AllowedZones @($Worker.Entry.allowed_zones)
  if ($violations.Count -gt 0) {
    $Worker.Status = "zone-violation"
    $ho = Write-Handoff -Worker $Worker -FailureType "validation" -ChangedFiles $changed -Violations $violations
    Send-Notify -Title "R9 zone violation: $($Worker.Entry.agent)" -Body "$($Worker.Entry.task_id): $($violations -join ', ')`n$ho"
  } else {
    Update-QueueTaskStatus -TaskId $Worker.Entry.task_id -Status "done" -Reason "exit-0; changed files within allowed_zones"
  }

  return $Worker
}

function Test-IftProposalDeltas {
  param([string]$Text)
  $flags = @()
  foreach ($line in ($Text -split "`n")) {
    $l = $line.Trim()
    if ($l -match "CRM-CONTRACT\.md") { $flags += "high contract-reference :: $l" }
    if ($l -match "§5|zone matrix|ownership") { $flags += "high ownership-zone :: $l" }
    if ($l -match "\bgeocod(ing|e)\b") { $flags += "high non-goal-geocoding :: $l" }
    if ($l -match "\bPostgres(QL)?\b.*\b(default|switch|migrate)\b|\b(switch|migrate)\b.*\bPostgres(QL)?\b") { $flags += "high postgres-default-switch :: $l" }
    if ($l -match "\b(auth|authentication|authorization|multi-?tenan|RBAC|RLS)\b") { $flags += "high auth-multitenancy :: $l" }
    if ($l -match "\bdeploy(ment|ing|ed)?\b") { $flags += "medium deployment :: $l" }
    if ($l -match "\bexternal\b.*\b(AI|LLM)\b|\b(OpenAI|Anthropic|Google|xAI)\s+API\b") { $flags += "high external-ai :: $l" }
    if ($l -match "/deals/\[id\]|\bnew\s+route\b|\bapp/[a-z]+/\[") { $flags += "medium new-route :: $l" }
    if ($l -match "\bglobal\s+search\b") { $flags += "medium global-search :: $l" }
    if ($l -match "\bschema\b.*\b(change|migration|migrate|alter)\b|\b(add|drop|alter)\s+(table|column|index)\b") { $flags += "high schema-change :: $l" }
    if ($l -match "\b(auto|automatic)\b.*\bmerge\b|\bmerge\b.*\bmain\b") { $flags += "high auto-merge :: $l" }
    if ($l -match "\b(bypass|skip|disable)\b.*\b(local\s+gate|gate|tests?)\b") { $flags += "high gate-bypass :: $l" }
  }
  return $flags
}

function Invoke-IftProposer {
  param([string]$CycleId)

  if (-not $Cfg.AllowIft) { return }
  $cmdTemplate = [Environment]::GetEnvironmentVariable("AUTONOMY_MANAGER_CMD")
  if (-not $cmdTemplate) { return }

  $dayDir = Join-Path $IftRoot (Get-Date -Format "yyyy-MM-dd")
  New-Item -ItemType Directory -Force -Path $dayDir | Out-Null

  $prompt = @"
$(Get-Content -Raw (Join-Path $RepoRoot "prompts\manager\r9-ift-proposer.md"))

=== PLAN.md ===
$(Get-Content -Raw (Join-Path $RepoRoot "PLAN.md"))

=== CRM-CONTRACT.md ===
$(Get-Content -Raw (Join-Path $RepoRoot "CRM-CONTRACT.md"))

=== autonomy-queue.json ===
$(Get-Content -Raw $QueuePath)

=== latest status ===
$(if (Test-Path (Join-Path $StatusRoot "latest.md")) { Get-Content -Raw (Join-Path $StatusRoot "latest.md") })
"@

  $promptPath = Join-Path $dayDir "ift-prompt-$CycleId.md"
  $outputPath = Join-Path $dayDir "ift-proposal-$CycleId.raw.md"
  $stdoutLog = Join-Path $dayDir "ift-$CycleId.stdout.log"
  $stderrLog = Join-Path $dayDir "ift-$CycleId.stderr.log"
  Set-Content -Path $promptPath -Value $prompt

  $expanded = $cmdTemplate.Replace("{PROMPT_FILE}", $promptPath).Replace("{WORKTREE}", $RepoRoot).Replace("{OUTPUT_FILE}", $outputPath)
  $status = Invoke-BoundedPipeline -ExpandedCommand $expanded -StdoutLog $stdoutLog -StderrLog $stderrLog -TimeoutSeconds 900
  if ($status -ne "exit-0") {
    Write-ManagerLog "IFT proposer failed: $status"
    return
  }

  if (Test-Path $outputPath) {
    $raw = Get-Content -Raw $outputPath
    $flags = Test-IftProposalDeltas -Text $raw
    Set-Content -Path (Join-Path $dayDir "flagged-deltas-$CycleId.md") -Value (($flags | ForEach-Object { "- $_" }) -join "`n")
    Send-Notify -Title "R9 IFT proposal ready" -Body "$outputPath`nFlags: $($flags.Count)"
  }
}

function Write-Status {
  param([object[]]$Workers, [object[]]$Rejected, [string]$CycleId)

  $status = [pscustomobject]@{
    schema_version = 1
    updated_at = (Get-Date -Format o)
    mode = $Mode
    cycle_id = $CycleId
    queue_path = $QueuePath
    workers = @($Workers | ForEach-Object {
      [pscustomobject]@{
        task_id = $_.Entry.task_id
        agent = $_.Entry.agent
        role = $_.Entry.role
        status = $_.Status
        stdout = $_.Stdout
        stderr = $_.Stderr
      }
    })
    rejected = @($Rejected)
  }

  $status | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $StatusRoot "latest.json")

  $md = @("# Managed Autonomy Status", "Updated: $(Get-Date -Format o)", "Mode: $Mode", "Cycle: $CycleId", "Queue: $QueuePath", "")
  $md += "## Workers"
  foreach ($w in $Workers) { $md += "- $($w.Entry.agent) / $($w.Entry.task_id) / $($w.Entry.role): $($w.Status)" }
  $md += ""
  $md += "## Rejected"
  foreach ($r in $Rejected) { $md += "- $($r.agent) / $($r.task_id): $($r.reason)" }

  Set-Content -Path (Join-Path $StatusRoot "latest.md") -Value ($md -join "`n")
}

Ensure-RuntimeDirs

$pre = Test-R8Precondition
if ($pre) {
  Write-ManagerLog "R8 precondition failed: $pre"
  Send-Notify -Title "R9 blocked: R8 precondition failed" -Body $pre
  exit 1
}

Initialize-Queue
Get-ModelAvailability | Out-Null

do {
  if (Test-LocalStop) {
    Write-ManagerLog "local STOP detected"
    break
  }

  if (Test-RemoteStop) {
    Write-ManagerLog "remote STOP detected"
    break
  }

  $cycleId = Get-Date -Format "yyyyMMdd-HHmmss"
  $queue = Get-QueueObject
  $dispatch = Invoke-ManagerCycle -CycleId $cycleId

  if (-not $dispatch) {
    Write-Status -Workers @() -Rejected @(@{ reason="manager failed or invalid JSON" }) -CycleId $cycleId
    if ($Once) { break }
    Start-Sleep -Seconds $LoopIntervalSeconds
    continue
  }

  $checked = Test-DispatchFull -Dispatch $dispatch -Queue $queue
  $valid = @($checked.Valid)
  $rejected = @($checked.Rejected)

  if ($valid.Count -eq 0) {
    Write-ManagerLog "no valid dispatch; invoking IFT proposer if enabled"
    Invoke-IftProposer -CycleId $cycleId
    Write-Status -Workers @() -Rejected $rejected -CycleId $cycleId
    if ($Once) { break }
    Start-Sleep -Seconds $LoopIntervalSeconds
    continue
  }

  $workers = @()
  foreach ($entry in $valid) {
    $workers += Start-WorkerProcess -Entry $entry -CycleId $cycleId
  }

  if (($workers | Where-Object { $_.Status -eq "running" }).Count -gt 0) {
    $workers = Monitor-Workers -Workers $workers
  }

  $finalWorkers = @()
  foreach ($w in $workers) {
    $w = Invoke-PostRunValidation -Worker $w

    if ($w.Status -in @("hard-timeout","heartbeat-timeout","quota-hit","zone-violation","cli-not-configured","review-cli-not-configured") -or ($w.Status -match "^exit-" -and $w.Status -ne "exit-0")) {
      $changed = Get-ChangedFilesSince -Worktree $w.Entry.worktree -BaseSha $w.BeforeHead
      $type = if ($w.Status -eq "quota-hit") { "quota" } elseif ($w.Status -eq "zone-violation") { "validation" } elseif ($w.Status -match "cli-not-configured") { "cli-not-configured" } elseif ($w.Status -match "timeout") { "timeout" } else { "crash" }
      $ho = Write-Handoff -Worker $w -FailureType $type -ChangedFiles $changed -Violations @()
      Write-ManagerLog "handoff written: $ho"
    }

    $finalWorkers += $w
  }

  Write-Status -Workers $finalWorkers -Rejected $rejected -CycleId $cycleId

  $qNow = Get-QueueObject
  $remaining = @($qNow.tasks | Where-Object { $_.status -in @("queued","active") })
  if ($remaining.Count -eq 0 -and $Cfg.AllowIft) {
    Invoke-IftProposer -CycleId $cycleId
  }

  if ($Once) { break }
  Start-Sleep -Seconds $LoopIntervalSeconds
} while ($true)
