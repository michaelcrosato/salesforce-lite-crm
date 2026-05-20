# scripts/autonomy-loop.ps1
param(
  [string]$PromptPath = ".\prompts\manager\continuous.md",
  [string]$StopFile = ".\AUTONOMY.STOP"
)
Write-Host "Starting Continuous Autonomy Loop..."
while ($true) {
  if (Test-Path $StopFile) {
    Write-Host "Stop file found:"
    Get-Content $StopFile
    break
  }
  if (-not (Test-Path ".\PLAN.md")) {
    Write-Host "Missing PLAN.md. Stopping."
    break
  }
  $plan = Get-Content ".\PLAN.md" -Raw
  if (
    $plan -match "(?im)^\s*\|\s*Continuous\s*\|\s*OFF\s*\|" -or
    $plan -match "(?im)^\s*Continuous:\s*OFF\s*$"
  ) {
    Write-Host "Continuous Mode is OFF. Stopping."
    break
  }
  if (-not (Test-Path $PromptPath)) {
    "Missing manager prompt: $PromptPath" | Set-Content $StopFile
    Write-Host "Missing manager prompt. Stopping."
    break
  }
  $prompt = Get-Content $PromptPath -Raw
  claude --permission-mode acceptEdits -p $prompt
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    "Claude exited with code $exitCode. Inspect CLI/account/provider state." | Set-Content $StopFile
    Write-Host "Claude exited with non-zero code $exitCode. Stopping."
    break
  }
  Start-Sleep -Seconds 10
}
