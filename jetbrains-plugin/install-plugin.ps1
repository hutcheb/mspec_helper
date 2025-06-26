# MSpec JetBrains Plugin Installation Script
# This script helps install the MSpec plugin in JetBrains IDEs

param(
    [string]$PluginPath = "",
    [string]$IDE = "",
    [switch]$Help
)

function Show-Help {
    Write-Host "MSpec JetBrains Plugin Installation Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\install-plugin.ps1 -PluginPath <path-to-zip> [-IDE <ide-name>]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -PluginPath   Path to the plugin ZIP file"
    Write-Host "  -IDE          Specific IDE to install to (optional)"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\install-plugin.ps1 -PluginPath .\build\distributions\jetbrains-plugin-1.0.0.zip"
    Write-Host "  .\install-plugin.ps1 -PluginPath .\plugin.zip -IDE IntelliJIdea"
    Write-Host ""
    Write-Host "Supported IDEs:"
    Write-Host "  - IntelliJIdea"
    Write-Host "  - PyCharm"
    Write-Host "  - WebStorm"
    Write-Host "  - PhpStorm"
    Write-Host "  - RubyMine"
    Write-Host "  - CLion"
    Write-Host "  - GoLand"
    Write-Host "  - DataGrip"
    Write-Host "  - Rider"
}

function Get-JetBrainsIDEs {
    $ides = @()
    $appData = $env:APPDATA
    $localAppData = $env:LOCALAPPDATA
    
    # Common JetBrains IDE directories
    $idePatterns = @(
        "IntelliJIdea*",
        "PyCharm*", 
        "WebStorm*",
        "PhpStorm*",
        "RubyMine*",
        "CLion*",
        "GoLand*",
        "DataGrip*",
        "Rider*"
    )
    
    foreach ($pattern in $idePatterns) {
        # Check AppData\Roaming\JetBrains
        $jetbrainsPath = Join-Path $appData "JetBrains"
        if (Test-Path $jetbrainsPath) {
            $found = Get-ChildItem -Path $jetbrainsPath -Directory -Name $pattern -ErrorAction SilentlyContinue
            foreach ($dir in $found) {
                $ides += @{
                    Name = $dir
                    Path = Join-Path $jetbrainsPath $dir
                    PluginsPath = Join-Path (Join-Path $jetbrainsPath $dir) "plugins"
                }
            }
        }
        
        # Check LocalAppData\JetBrains
        $localJetbrainsPath = Join-Path $localAppData "JetBrains"
        if (Test-Path $localJetbrainsPath) {
            $found = Get-ChildItem -Path $localJetbrainsPath -Directory -Name $pattern -ErrorAction SilentlyContinue
            foreach ($dir in $found) {
                $ides += @{
                    Name = $dir
                    Path = Join-Path $localJetbrainsPath $dir
                    PluginsPath = Join-Path (Join-Path $localJetbrainsPath $dir) "plugins"
                }
            }
        }
    }
    
    return $ides
}

function Install-Plugin {
    param(
        [string]$PluginZipPath,
        [string]$TargetIDE = ""
    )
    
    if (-not (Test-Path $PluginZipPath)) {
        Write-Error "Plugin file not found: $PluginZipPath"
        return $false
    }
    
    $ides = Get-JetBrainsIDEs
    
    if ($ides.Count -eq 0) {
        Write-Warning "No JetBrains IDEs found in standard locations."
        Write-Host "Please install the plugin manually:"
        Write-Host "1. Open your JetBrains IDE"
        Write-Host "2. Go to File → Settings → Plugins"
        Write-Host "3. Click gear icon → Install Plugin from Disk"
        Write-Host "4. Select: $PluginZipPath"
        return $false
    }
    
    Write-Host "Found JetBrains IDEs:" -ForegroundColor Green
    for ($i = 0; $i -lt $ides.Count; $i++) {
        Write-Host "  [$i] $($ides[$i].Name)" -ForegroundColor Yellow
    }
    
    $targetIDEs = @()
    
    if ($TargetIDE) {
        $targetIDEs = $ides | Where-Object { $_.Name -like "*$TargetIDE*" }
        if ($targetIDEs.Count -eq 0) {
            Write-Error "IDE '$TargetIDE' not found."
            return $false
        }
    } else {
        Write-Host ""
        $choice = Read-Host "Enter IDE number to install to (or 'all' for all IDEs)"
        
        if ($choice -eq "all") {
            $targetIDEs = $ides
        } elseif ($choice -match '^\d+$' -and [int]$choice -lt $ides.Count) {
            $targetIDEs = @($ides[[int]$choice])
        } else {
            Write-Error "Invalid choice."
            return $false
        }
    }
    
    foreach ($ide in $targetIDEs) {
        Write-Host "Installing plugin to $($ide.Name)..." -ForegroundColor Green
        
        # Ensure plugins directory exists
        if (-not (Test-Path $ide.PluginsPath)) {
            New-Item -Path $ide.PluginsPath -ItemType Directory -Force | Out-Null
        }
        
        # Extract plugin to plugins directory
        $pluginName = [System.IO.Path]::GetFileNameWithoutExtension($PluginZipPath)
        $extractPath = Join-Path $ide.PluginsPath $pluginName
        
        try {
            # Remove existing plugin if present
            if (Test-Path $extractPath) {
                Remove-Item -Path $extractPath -Recurse -Force
            }
            
            # Extract new plugin
            Expand-Archive -Path $PluginZipPath -DestinationPath $extractPath -Force
            Write-Host "  ✓ Plugin installed successfully" -ForegroundColor Green
        } catch {
            Write-Error "  ✗ Failed to install plugin: $($_.Exception.Message)"
        }
    }
    
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host "Please restart your JetBrains IDE(s) to activate the plugin." -ForegroundColor Yellow
    
    return $true
}

# Main script execution
if ($Help) {
    Show-Help
    exit 0
}

if (-not $PluginPath) {
    # Try to find the plugin in the build directory
    $buildPlugin = ".\build\distributions\jetbrains-plugin-*.zip"
    $found = Get-ChildItem -Path $buildPlugin -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($found) {
        $PluginPath = $found.FullName
        Write-Host "Found plugin: $PluginPath" -ForegroundColor Green
    } else {
        Write-Error "Plugin path not specified and no plugin found in build directory."
        Write-Host "Use -Help for usage information."
        exit 1
    }
}

Install-Plugin -PluginZipPath $PluginPath -TargetIDE $IDE
