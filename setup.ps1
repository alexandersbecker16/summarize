# Ensures Node/npm are available for this project (portable install, no admin).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$portableNode = Join-Path $root '.tools\node\node.exe'
$portableNpm = Join-Path $root '.tools\node\npm.cmd'

function Add-PortableNodeToPath {
  $bin = Join-Path $root '.tools\node'
  if ($env:PATH -notlike "*$bin*") {
    $env:PATH = "$bin;$env:PATH"
  }
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm) {
  Write-Host "Using system npm: $($npm.Source)"
  npm -v
  exit 0
}

if (Test-Path $portableNpm) {
  Write-Host "Using portable Node at .tools\node"
  Add-PortableNodeToPath
  & $portableNode -v
  & $portableNpm -v
  exit 0
}

Write-Host "npm not found — downloading portable Node.js (no admin)..."
$tools = Join-Path $root '.tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$version = 'v24.20.0'
$zipName = "node-$version-win-x64.zip"
$zip = Join-Path $env:TEMP $zipName
$url = "https://nodejs.org/dist/$version/$zipName"

Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath $tools -Force

$extracted = Join-Path $tools "node-$version-win-x64"
$dest = Join-Path $tools 'node'
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Rename-Item $extracted $dest

Add-PortableNodeToPath
Write-Host "Installed portable Node:"
& $portableNode -v
& $portableNpm -v
Write-Host "Done. Run: npm install && npm run dev"
