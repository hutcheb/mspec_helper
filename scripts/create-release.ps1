#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates a GitHub release for the MSpec Language Server project
.DESCRIPTION
    This script creates a GitHub release with the VSCode extension package
.PARAMETER Tag
    The git tag for the release (e.g., v0.1.0-alpha)
.PARAMETER Token
    GitHub personal access token (optional, will prompt if not provided)
.EXAMPLE
    .\scripts\create-release.ps1 -Tag "v0.1.0-alpha"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Tag,
    
    [Parameter(Mandatory = $false)]
    [string]$Token
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get the repository information
$RepoOwner = "hutcheb"
$RepoName = "mspec_helper"

# Get GitHub token if not provided
if (-not $Token) {
    $Token = Read-Host -Prompt "Enter your GitHub Personal Access Token" -AsSecureString
    $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token))
}

# Validate tag format
if ($Tag -notmatch '^v\d+\.\d+\.\d+(-\w+)?$') {
    Write-Error "Tag must be in format v0.0.0 or v0.0.0-alpha"
    exit 1
}

Write-Host "Creating release for tag: $Tag" -ForegroundColor Green

# Check if tag exists
try {
    git rev-parse $Tag 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tag $Tag does not exist. Please create the tag first with: git tag $Tag && git push origin $Tag"
        exit 1
    }
} catch {
    Write-Error "Failed to check if tag exists: $_"
    exit 1
}

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
} catch {
    Write-Error "Build failed: $_"
    exit 1
}

# Package VSCode extension
Write-Host "Packaging VSCode extension..." -ForegroundColor Yellow
try {
    npm run package:vscode
    if ($LASTEXITCODE -ne 0) {
        Write-Error "VSCode extension packaging failed"
        exit 1
    }
} catch {
    Write-Error "VSCode extension packaging failed: $_"
    exit 1
}

# Find the VSIX file
$VsixFile = Get-ChildItem -Path "vscode-extension" -Filter "*.vsix" | Select-Object -First 1
if (-not $VsixFile) {
    Write-Error "No VSIX file found in vscode-extension directory"
    exit 1
}

Write-Host "Found VSIX file: $($VsixFile.Name)" -ForegroundColor Green

# Extract changelog for this version
$ChangelogContent = ""
if (Test-Path "CHANGELOG.md") {
    $ChangelogLines = Get-Content "CHANGELOG.md"
    $InVersionSection = $false
    $VersionPattern = "## \[$($Tag.TrimStart('v'))\]"
    
    foreach ($line in $ChangelogLines) {
        if ($line -match $VersionPattern) {
            $InVersionSection = $true
            continue
        }
        if ($InVersionSection -and $line -match "^## \[") {
            break
        }
        if ($InVersionSection) {
            $ChangelogContent += "$line`n"
        }
    }
}

if (-not $ChangelogContent) {
    $ChangelogContent = "Release $Tag"
}

# Determine if this is a prerelease
$IsPrerelease = $Tag -match '-'

# Create the release using GitHub API
$ReleaseData = @{
    tag_name = $Tag
    name = "MSpec Language Support $Tag"
    body = $ChangelogContent.Trim()
    draft = $false
    prerelease = $IsPrerelease
} | ConvertTo-Json

$Headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "MSpec-Release-Script"
}

Write-Host "Creating GitHub release..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/releases" -Method Post -Body $ReleaseData -Headers $Headers -ContentType "application/json"
    Write-Host "Release created successfully: $($Response.html_url)" -ForegroundColor Green
    
    # Upload the VSIX file
    Write-Host "Uploading VSIX file..." -ForegroundColor Yellow
    $UploadUrl = $Response.upload_url -replace '\{\?name,label\}', "?name=$($VsixFile.Name)"
    
    $FileBytes = [System.IO.File]::ReadAllBytes($VsixFile.FullName)
    $UploadHeaders = $Headers.Clone()
    $UploadHeaders["Content-Type"] = "application/zip"
    
    $UploadResponse = Invoke-RestMethod -Uri $UploadUrl -Method Post -Body $FileBytes -Headers $UploadHeaders
    Write-Host "VSIX file uploaded successfully" -ForegroundColor Green
    
    Write-Host "`nRelease Summary:" -ForegroundColor Cyan
    Write-Host "- Release URL: $($Response.html_url)" -ForegroundColor White
    Write-Host "- Tag: $Tag" -ForegroundColor White
    Write-Host "- Prerelease: $IsPrerelease" -ForegroundColor White
    Write-Host "- VSIX File: $($VsixFile.Name) ($([math]::Round($VsixFile.Length / 1KB, 2)) KB)" -ForegroundColor White
    
} catch {
    $ErrorDetails = $_.Exception.Message
    if ($_.Exception.Response) {
        $ErrorStream = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($ErrorStream)
        $ErrorDetails = $Reader.ReadToEnd()
    }
    Write-Error "Failed to create release: $ErrorDetails"
    exit 1
}

Write-Host "`nRelease created successfully! 🎉" -ForegroundColor Green
