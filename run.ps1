# Install deps (if needed) and start the StudyForge dev server.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

& "$PSScriptRoot\setup.ps1"
if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
  # setup exits 0 on success; continue either way if npm is now available
}

$portableBin = Join-Path $PSScriptRoot '.tools\node'
if (Test-Path (Join-Path $portableBin 'npm.cmd')) {
  if ($env:PATH -notlike "*$portableBin*") {
    $env:PATH = "$portableBin;$env:PATH"
  }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is still unavailable. Run .\setup.ps1 or install Node.js from https://nodejs.org"
}

if (-not (Test-Path '.\node_modules')) {
  Write-Host 'Installing dependencies...'
  npm install
}

Write-Host 'Starting StudyForge at http://localhost:5173 ...'
npm run dev
