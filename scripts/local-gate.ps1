[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$OverallStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

function Invoke-GateStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host ""
    Write-Host -ForegroundColor Cyan "==> Starting: $Name"
    
    $StepStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $global:LASTEXITCODE = 0
    
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Exit code $LASTEXITCODE"
        }
        $StepStopwatch.Stop()
        $duration = [math]::Round($StepStopwatch.Elapsed.TotalSeconds, 2)
        Write-Host -ForegroundColor Green "==> Success: $Name ($duration seconds)"
    } catch {
        $StepStopwatch.Stop()
        $duration = [math]::Round($StepStopwatch.Elapsed.TotalSeconds, 2)
        Write-Host -ForegroundColor Red "==> FAILED: $Name after $duration seconds"
        Write-Host -ForegroundColor Red "Error: $_"
        throw "$Name failed"
    }
}

Push-Location $RepoRoot
try {
    Write-Host -ForegroundColor Magenta "Starting Local Gate Validation..."

    Invoke-GateStep "npm install" { & npm install }

    if (-not (Test-Path -LiteralPath ".env")) {
        if (-not (Test-Path -LiteralPath ".env.example")) {
            throw ".env is missing and .env.example was not found"
        }
        Write-Host ""
        Write-Host -ForegroundColor Cyan "==> Copy .env.example to .env"
        Copy-Item -LiteralPath ".env.example" -Destination ".env"
    }

    Invoke-GateStep "npx prisma generate" { & npx prisma generate }
    Invoke-GateStep "npx prisma db push" { & npx prisma db push }
    Invoke-GateStep "npm run seed" { & npm run seed }
    Invoke-GateStep "npm run test" { & npm run test }
    Invoke-GateStep "npm run typecheck" { & npm run typecheck }
    Invoke-GateStep "npm run build" { & npm run build }
    Invoke-GateStep "npx playwright install chromium" { & npx playwright install chromium }
    Invoke-GateStep "npm run test:e2e" { & npm run test:e2e }

    $OverallStopwatch.Stop()
    $totalMinutes = [math]::Floor($OverallStopwatch.Elapsed.TotalMinutes)
    $totalSeconds = [math]::Round($OverallStopwatch.Elapsed.TotalSeconds % 60, 2)
    
    Write-Host ""
    Write-Host -ForegroundColor Green "============================================================"
    Write-Host -ForegroundColor Green "Local gate completed successfully in ${totalMinutes}m ${totalSeconds}s."
    Write-Host -ForegroundColor Green "============================================================"
}
catch {
    $OverallStopwatch.Stop()
    Write-Host ""
    Write-Host -ForegroundColor Red "============================================================"
    Write-Host -ForegroundColor Red "Local gate failed. See above for details."
    Write-Host -ForegroundColor Red "============================================================"
    exit 1
}
finally {
    Pop-Location
}
