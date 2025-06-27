#!/usr/bin/env pwsh
# Build script for VSCode extension with bundled language server

Write-Host "Building MSpec VSCode Extension..." -ForegroundColor Green

# Step 1: Build and bundle the language server
Write-Host "Building language server..." -ForegroundColor Yellow
Set-Location "../server"
npm run bundle
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to build language server"
  exit 1
}

# Step 2: Copy bundled server to extension directory
Write-Host "Copying bundled server..." -ForegroundColor Yellow
Set-Location "../vscode-extension"
if (!(Test-Path "server")) {
  New-Item -ItemType Directory -Name "server"
}
Copy-Item "../server/out/server-bundled.js" "server/server-bundled.js" -Force

# Step 3: Build and bundle the extension
Write-Host "Building and bundling extension..." -ForegroundColor Yellow
npm run bundle
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to build extension"
  exit 1
}

# Step 4: Package the extension
Write-Host "Packaging extension..." -ForegroundColor Yellow
npm run package
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to package extension"
  exit 1
}

Write-Host "Extension built successfully!" -ForegroundColor Green
Write-Host "VSIX file: mspec-language-support-1.0.0.vsix" -ForegroundColor Cyan
