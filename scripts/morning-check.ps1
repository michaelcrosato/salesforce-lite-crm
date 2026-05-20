#Requires -Version 5.1
[CmdletBinding()]
param(
  [string] $Repo = "",
  [string] $Agent = "codex",
  [switch] $RunGate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Repo = Join-Path $PSScriptRoot ".."
}

$Repo = (Resolve-Path -LiteralPath $Repo).Path
Push-Location $Repo
try {
  Write-Host "== Branch / HEAD"
  git rev-parse --abbrev-ref HEAD
  git rev-parse --short HEAD

  Write-Host ""
  Write-Host "== Recent commits"
  git log --oneline -20

  Write-Host ""
  Write-Host "== Status"
  git status --short

  Write-Host ""
  Write-Host "== Latest agent run logs"
  $runRoot = Join-Path $Repo ("agent-runs\{0}" -f $Agent)
  if (Test-Path -LiteralPath $runRoot) {
    Get-ChildItem -LiteralPath $runRoot -Directory |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 5 Name, LastWriteTime, FullName |
      Format-Table -AutoSize
  } else {
    Write-Host "No agent-runs folder found for $Agent."
  }

  Write-Host ""
  Write-Host "== SUMMARY.$Agent.md"
  $summary = Join-Path $Repo ("SUMMARY.{0}.md" -f $Agent)
  if (Test-Path -LiteralPath $summary) { Get-Content -Raw -LiteralPath $summary } else { Write-Host "Missing $summary" }

  Write-Host ""
  Write-Host "== BLOCKERS.$Agent.md"
  $blockers = Join-Path $Repo ("BLOCKERS.{0}.md" -f $Agent)
  if (Test-Path -LiteralPath $blockers) { Get-Content -Raw -LiteralPath $blockers } else { Write-Host "Missing $blockers" }

  if ($RunGate) {
    Write-Host ""
    Write-Host "== Running local gate"
    $gate = Join-Path $Repo "scripts\local-gate.ps1"
    if (-not (Test-Path -LiteralPath $gate)) { throw "Missing $gate" }
    $ps = Get-Command pwsh -ErrorAction SilentlyContinue
    if (-not $ps) { $ps = Get-Command powershell -ErrorAction SilentlyContinue }
    if (-not $ps) { throw "Could not find pwsh or powershell." }
    & $ps.Source -NoLogo -NoProfile -ExecutionPolicy Bypass -File $gate
    if ($LASTEXITCODE -ne 0) { throw "local gate failed with exit code $LASTEXITCODE" }
  }
}
finally {
  Pop-Location
}
