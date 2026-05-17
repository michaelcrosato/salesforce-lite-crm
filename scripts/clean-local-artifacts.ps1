[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$candidates = New-Object System.Collections.Generic.List[string]

foreach ($relative in @(".claude", "claude-code-prompt.txt", "playwright-report", "test-results", ".next", "_screenshots")) {
    $path = Join-Path $RepoRoot $relative
    if (Test-Path -LiteralPath $path) {
        $candidates.Add((Resolve-Path -LiteralPath $path).Path)
    }
}

foreach ($pattern in @("*.log", "*.zip", "*prompt*.txt")) {
    Get-ChildItem -LiteralPath $RepoRoot -File -Filter $pattern -ErrorAction SilentlyContinue |
        ForEach-Object { $candidates.Add($_.FullName) }
}

$unique = $candidates | Sort-Object -Unique

if (-not $unique) {
    Write-Host "No local artifacts matched."
    return
}

Write-Host "Local artifact candidates:"
foreach ($path in $unique) {
    Write-Host $path
}

if (-not $Apply) {
    Write-Host ""
    Write-Host "Dry run only. Re-run with -Apply to delete these paths."
    return
}

foreach ($path in $unique) {
    $full = (Resolve-Path -LiteralPath $path).Path
    if (-not $full.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete path outside repo: $full"
    }

    if ($PSCmdlet.ShouldProcess($full, "Remove local artifact")) {
        Remove-Item -LiteralPath $full -Recurse -Force
    }
}

Write-Host "Local artifact cleanup complete."
