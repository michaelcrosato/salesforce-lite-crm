[CmdletBinding()]
param(
    [string]$Output
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $Output) {
    $parent = Split-Path -Parent $RepoRoot
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Output = Join-Path $parent "salesforce-lite-crm-head-$stamp.zip"
}

Push-Location $RepoRoot
try {
    Write-Host "git archive --format=zip --output `"$Output`" HEAD"
    & git archive --format=zip --output $Output HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "git archive failed with exit code $LASTEXITCODE"
    }
    Write-Host "Archive written: $Output"
}
finally {
    Pop-Location
}
