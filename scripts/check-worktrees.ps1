[CmdletBinding()]
param(
    [string[]]$ExpectedPaths = @(
        "C:\dev\salesforce-lite-crm",
        "C:\dev\salesforce-lite-crm-claude",
        "C:\dev\salesforce-lite-crm-grok",
        "C:\dev\salesforce-lite-crm-gemini"
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "==> git worktree list"
& git -C $RepoRoot worktree list

foreach ($Path in $ExpectedPaths) {
    Write-Host ""
    Write-Host "==> $Path"
    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "MISSING"
        continue
    }

    $branch = (& git -C $Path branch --show-current).Trim()
    if (-not $branch) {
        $branch = "(detached or unknown)"
    }

    Write-Host "Branch: $branch"
    $status = & git -C $Path status --short
    if ($status) {
        Write-Host "Status:"
        $status | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "Status: clean"
    }
}
