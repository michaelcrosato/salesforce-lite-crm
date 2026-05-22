[CmdletBinding()]
param(
    [string[]]$ExpectedPaths = @(
        "C:\dev\salesforce-lite-crm",
        "C:\dev\salesforce-lite-crm-codex",
        "C:\dev\salesforce-lite-crm-claude",
        "C:\dev\salesforce-lite-crm-grok",
        "C:\dev\salesforce-lite-crm-gemini"
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Get-WorktreeMode {
    param([Parameter(Mandatory = $true)][string]$Path)

    $normalized = $Path.Replace("/", "\").TrimEnd("\")
    switch -Regex ($normalized) {
        '^C:\\dev\\salesforce-lite-crm$' { return "single-agent-root" }
        '^C:\\dev\\salesforce-lite-crm-codex$' { return "parallel-codex" }
        '^C:\\dev\\salesforce-lite-crm-claude$' { return "parallel-claude" }
        '^C:\\dev\\salesforce-lite-crm-grok$' { return "parallel-grok" }
        '^\\c\\dev\\salesforce-lite-crm-grok$' { return "parallel-grok" }
        '^C:\\dev\\salesforce-lite-crm-gemini$' { return "parallel-gemini" }
        default { return "custom" }
    }
}

function Get-ExpectedPrefix {
    param([Parameter(Mandatory = $true)][string]$Mode)

    switch ($Mode) {
        "parallel-codex" { return "codex/" }
        "parallel-claude" { return "claude/" }
        "parallel-grok" { return "grok/" }
        "parallel-gemini" { return "gemini/" }
        default { return "" }
    }
}

Write-Host "==> git worktree list"
& git -C $RepoRoot worktree list

foreach ($Path in $ExpectedPaths) {
    Write-Host ""
    Write-Host "==> $Path"
    $mode = Get-WorktreeMode -Path $Path
    Write-Host "Mode: $mode"
    if (-not (Test-Path -LiteralPath $Path)) {
        if ($mode -eq "single-agent-root") {
            Write-Host "MISSING: root worktree unavailable"
        }
        else {
            Write-Host "MISSING: parallel worktree not present; create only when launching that agent"
        }
        continue
    }

    $insideWorktree = $null
    $isGitWorktree = $false
    try {
        $insideWorktree = & git -C $Path rev-parse --is-inside-work-tree 2>$null
        $isGitWorktree = ($LASTEXITCODE -eq 0 -and $insideWorktree -and $insideWorktree.Trim() -eq "true")
    }
    catch {
        $isGitWorktree = $false
    }

    if (-not $isGitWorktree) {
        if ($mode -eq "single-agent-root") {
            Write-Host "MISSING: root path exists but is not a git worktree"
        }
        else {
            Write-Host "MISSING: path exists but is not a git worktree; repair only when launching that agent"
        }
        continue
    }

    $branchOutput = & git -C $Path branch --show-current 2>$null
    $branch = if ($branchOutput) { $branchOutput.Trim() } else { "" }
    if (-not $branch) {
        $branch = "(detached or unknown)"
    }

    Write-Host "Branch: $branch"
    $expectedPrefix = Get-ExpectedPrefix -Mode $mode
    if ($expectedPrefix -and -not $branch.StartsWith($expectedPrefix)) {
        Write-Host "Branch prefix warning: expected $expectedPrefix for $mode"
    }
    $status = & git -C $Path status --short
    if ($status) {
        Write-Host "Status:"
        $status | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "Status: clean"
    }
}
