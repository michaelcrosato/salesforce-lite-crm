#Requires -Version 5.1
<#
.SYNOPSIS
  Detect protected-file drift for the canonical Codex YOLO loop scaffold.

.DESCRIPTION
  This script hashes a fixed protected path set and verifies it against
  scripts/gate-integrity.sha256.json. It detects protected-file drift; it does
  not physically prevent an unsandboxed YOLO process from editing files.

  If the manifest is missing, the script generates it once from the current
  protected path set and exits successfully. There is intentionally no normal
  regenerate switch. A human can intentionally delete or update the manifest.
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$ManifestPath = Join-Path $RepoRoot "scripts\gate-integrity.sha256.json"

$MandatoryProtectedPaths = @(
  "docs/AXIOMS.md",
  "docs/AGENT-LOOP.md",
  "scripts/local-gate.ps1",
  "scripts/assert-gate-integrity.ps1",
  "scripts/run-codex-yolo-loop.ps1",
  "package.json"
)

$OptionalProtectedPaths = @(
  "package-lock.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "eslint.config.js",
  ".eslintrc",
  ".eslintrc.json",
  "vitest.config.ts",
  "playwright.config.ts",
  "prisma/schema.prisma",
  "prisma.config.ts"
)

function Get-Utf8NoBomEncoding {
  return (New-Object System.Text.UTF8Encoding -ArgumentList $false)
}

function ConvertTo-NormalizedRepoPath {
  param([Parameter(Mandatory = $true)][string] $Path)
  return ($Path -replace "\\", "/")
}

function Join-RepoPath {
  param([Parameter(Mandatory = $true)][string] $RepoPath)
  return (Join-Path $RepoRoot ($RepoPath -replace "/", [System.IO.Path]::DirectorySeparatorChar))
}

function Stop-Integrity {
  param([Parameter(Mandatory = $true)][string] $Message)
  Write-Error $Message
  exit 1
}

function Get-ProtectedPathSet {
  $paths = New-Object System.Collections.Generic.List[string]

  foreach ($path in $MandatoryProtectedPaths) {
    $normalized = ConvertTo-NormalizedRepoPath -Path $path
    $fullPath = Join-RepoPath -RepoPath $normalized
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      Stop-Integrity "Protected file is missing: $normalized"
    }
    $paths.Add($normalized)
  }

  foreach ($path in $OptionalProtectedPaths) {
    $normalized = ConvertTo-NormalizedRepoPath -Path $path
    $fullPath = Join-RepoPath -RepoPath $normalized
    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
      $paths.Add($normalized)
    }
  }

  return @($paths | Sort-Object -Unique)
}

function Get-FileSha256 {
  param([Parameter(Mandatory = $true)][string] $RepoPath)
  $fullPath = Join-RepoPath -RepoPath $RepoPath
  return ((Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant())
}

function New-ManifestEntry {
  param([Parameter(Mandatory = $true)][string] $RepoPath)
  return [ordered]@{
    path = $RepoPath
    sha256 = Get-FileSha256 -RepoPath $RepoPath
  }
}

function Write-Manifest {
  param([Parameter(Mandatory = $true)][string[]] $ProtectedPaths)

  $entries = @($ProtectedPaths | ForEach-Object { New-ManifestEntry -RepoPath $_ })
  $manifest = [ordered]@{
    schemaVersion = 1
    algorithm = "SHA256"
    note = "Protected-file drift detector. Delete or update intentionally only by human action."
    files = $entries
  }

  $json = $manifest | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText($ManifestPath, ($json + [Environment]::NewLine), (Get-Utf8NoBomEncoding))

  Write-Host "Generated gate integrity manifest: scripts/gate-integrity.sha256.json"
  Write-Host "Protected file hashes:"
  foreach ($entry in $entries) {
    Write-Host ("{0}  {1}" -f $entry.sha256, $entry.path)
  }
}

function Read-Manifest {
  try {
    $raw = [System.IO.File]::ReadAllText($ManifestPath, (Get-Utf8NoBomEncoding))
    return ($raw | ConvertFrom-Json -ErrorAction Stop)
  }
  catch {
    Stop-Integrity ("Malformed integrity manifest: {0}" -f $_.Exception.Message)
  }
}

function Get-ManifestEntries {
  param([Parameter(Mandatory = $true)] $Manifest)

  if (-not ($Manifest.PSObject.Properties.Name -contains "algorithm") -or $Manifest.algorithm -ne "SHA256") {
    Stop-Integrity "Malformed integrity manifest: algorithm must be SHA256."
  }

  if (-not ($Manifest.PSObject.Properties.Name -contains "files")) {
    Stop-Integrity "Malformed integrity manifest: files array is missing."
  }

  $entries = @($Manifest.files)
  if ($entries.Count -eq 0) {
    Stop-Integrity "Malformed integrity manifest: files array is empty."
  }

  $seen = @{}
  foreach ($entry in $entries) {
    if (-not ($entry.PSObject.Properties.Name -contains "path") -or -not ($entry.PSObject.Properties.Name -contains "sha256")) {
      Stop-Integrity "Malformed integrity manifest: every entry needs path and sha256."
    }

    $path = ConvertTo-NormalizedRepoPath -Path ([string]$entry.path)
    $sha = ([string]$entry.sha256).ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($path) -or $path.Contains("..")) {
      Stop-Integrity "Malformed integrity manifest: invalid protected path '$path'."
    }

    if ($sha -notmatch "^[0-9a-f]{64}$") {
      Stop-Integrity "Malformed integrity manifest: invalid SHA-256 for '$path'."
    }

    if ($seen.ContainsKey($path)) {
      Stop-Integrity "Malformed integrity manifest: duplicate protected path '$path'."
    }
    $seen[$path] = $sha
  }

  return $seen
}

function Compare-PathSets {
  param(
    [Parameter(Mandatory = $true)][string[]] $CurrentPaths,
    [Parameter(Mandatory = $true)][hashtable] $ManifestEntries
  )

  $manifestPaths = @($ManifestEntries.Keys | Sort-Object)
  $diff = @(Compare-Object -ReferenceObject $manifestPaths -DifferenceObject $CurrentPaths)
  if ($diff.Count -gt 0) {
    Write-Host "Protected path set drift detected."
    foreach ($item in $diff) {
      $side = if ($item.SideIndicator -eq "<=") { "manifest-only" } else { "current-only" }
      Write-Host ("{0}: {1}" -f $side, $item.InputObject)
    }
    Stop-Integrity "Unexpected protected path drift."
  }
}

$currentProtectedPaths = @(Get-ProtectedPathSet)

if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
  Write-Manifest -ProtectedPaths $currentProtectedPaths
  exit 0
}

$manifest = Read-Manifest
$entriesByPath = Get-ManifestEntries -Manifest $manifest
Compare-PathSets -CurrentPaths $currentProtectedPaths -ManifestEntries $entriesByPath

foreach ($path in $currentProtectedPaths) {
  $fullPath = Join-RepoPath -RepoPath $path
  if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
    Stop-Integrity "Protected file is missing: $path"
  }

  $expected = $entriesByPath[$path]
  $actual = Get-FileSha256 -RepoPath $path
  if ($actual -ne $expected) {
    Write-Host "Protected file hash mismatch."
    Write-Host ("Path:     {0}" -f $path)
    Write-Host ("Expected: {0}" -f $expected)
    Write-Host ("Actual:   {0}" -f $actual)
    Stop-Integrity "Gate integrity verification failed."
  }
}

Write-Host "Gate integrity verified."
