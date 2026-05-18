[CmdletBinding()]
param(
    [string]$BaseBranch = "main",
    [string]$ClaudeBranch,
    [string]$GrokBranch,
    [string]$GeminiBranch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$targets = @(
    @{ Name = "Claude"; Path = "C:\dev\salesforce-lite-crm-claude"; Branch = $ClaudeBranch },
    @{ Name = "Grok"; Path = "C:\dev\salesforce-lite-crm-grok"; Branch = $GrokBranch },
    @{ Name = "Gemini"; Path = "C:\dev\salesforce-lite-crm-gemini"; Branch = $GeminiBranch }
)

foreach ($target in $targets) {
    $name = $target.Name
    $path = $target.Path
    $branch = $target.Branch

    Write-Host ""
    Write-Host "==> $name worktree"

    if (-not $branch) {
        Write-Host "SKIP: no branch argument provided."
        continue
    }

    if (Test-Path -LiteralPath $path) {
        Write-Host "SKIP: path already exists: $path"
        continue
    }

    & git -C $RepoRoot show-ref --verify --quiet "refs/heads/$branch"
    $branchExists = ($LASTEXITCODE -eq 0)

    if ($branchExists) {
        Write-Host "git -C `"$RepoRoot`" worktree add `"$path`" `"$branch`""
        & git -C $RepoRoot worktree add $path $branch
    }
    else {
        Write-Host "git -C `"$RepoRoot`" worktree add -b `"$branch`" `"$path`" `"$BaseBranch`""
        & git -C $RepoRoot worktree add -b $branch $path $BaseBranch
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create $name worktree at $path"
    }
}
