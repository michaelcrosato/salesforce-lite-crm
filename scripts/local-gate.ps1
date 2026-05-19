[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Invoke-GateStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Name"
    $global:LASTEXITCODE = 0
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Push-Location $RepoRoot
try {
    Invoke-GateStep "npm install" { & npm install }

    if (-not (Test-Path -LiteralPath ".env")) {
        if (-not (Test-Path -LiteralPath ".env.example")) {
            throw ".env is missing and .env.example was not found"
        }
        Write-Host ""
        Write-Host "==> Copy .env.example to .env"
        Copy-Item -LiteralPath ".env.example" -Destination ".env"
    }

    Invoke-GateStep "npx prisma generate" { & npx prisma generate }
    Invoke-GateStep "npx prisma db push" { & npx prisma db push }
    Invoke-GateStep "npm run seed" { & npm run seed }
    Invoke-GateStep "npm run lint" { & npm run lint }
    Invoke-GateStep "npm run test" { & npm run test }
    Invoke-GateStep "npm run build" { & npm run build }
    Invoke-GateStep "npx playwright install chromium" { & npx playwright install chromium }
    Invoke-GateStep "npm run test:e2e" { & npm run test:e2e }

    Write-Host ""
    Write-Host "Local gate completed successfully."
}
finally {
    Pop-Location
}
