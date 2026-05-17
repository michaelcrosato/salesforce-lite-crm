[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $RepoRoot
try {
    Write-Host "==> Branch"
    & git branch --show-current

    Write-Host ""
    Write-Host "==> Status"
    $status = & git status --short
    if ($status) {
        $status | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "clean"
    }

    Write-Host ""
    Write-Host "==> Latest commits"
    & git log --oneline -10

    Write-Host ""
    Write-Host "==> Report files"
    foreach ($agent in @("codex", "claude", "grok", "gemini")) {
        $summary = "SUMMARY.$agent.md"
        $blockers = "BLOCKERS.$agent.md"
        Write-Host "$summary : $(Test-Path -LiteralPath $summary)"
        Write-Host "$blockers : $(Test-Path -LiteralPath $blockers)"
    }
}
finally {
    Pop-Location
}
