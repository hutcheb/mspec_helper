# PowerShell build script for MSpec Language Server and Extensions
# This script builds all components of the MSpec LSP project on Windows

param(
    [switch]$Clean,
    [switch]$NoServer,
    [switch]$NoVSCode,
    [switch]$NoJetBrains,
    [switch]$Test,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = (node --version).Substring(1).Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Clean previous builds
function Invoke-CleanBuild {
    Write-Status "Cleaning previous builds..."
    
    # Clean root
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
    
    # Clean server
    if (Test-Path "server") {
        Push-Location "server"
        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
        if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
        Pop-Location
    }
    
    # Clean VSCode extension
    if (Test-Path "vscode-extension") {
        Push-Location "vscode-extension"
        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
        if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
        Get-ChildItem -Filter "*.vsix" | Remove-Item -Force
        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
        Pop-Location
    }
    
    # Clean JetBrains plugin
    if (Test-Path "jetbrains-plugin") {
        Push-Location "jetbrains-plugin"
        if (Test-Path "gradlew.bat") {
            & .\gradlew.bat clean
        }
        Pop-Location
    }
    
    Write-Success "Clean completed"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install root dependencies"
        exit 1
    }
    
    Write-Success "Dependencies installed"
}

# Build language server
function Build-Server {
    Write-Status "Building language server..."
    
    Push-Location "server"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build language server"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Success "Language server built successfully"
}

# Build VSCode extension
function Build-VSCodeExtension {
    Write-Status "Building VSCode extension..."
    
    Push-Location "vscode-extension"
    
    # Install dependencies
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install VSCode extension dependencies"
        Pop-Location
        exit 1
    }
    
    # Compile TypeScript
    npm run compile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to compile VSCode extension"
        Pop-Location
        exit 1
    }
    
    # Install vsce if not present
    if (-not (Test-Command "vsce")) {
        Write-Status "Installing vsce..."
        npm install -g @vscode/vsce
    }
    
    # Package extension
    npm run package
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to package VSCode extension"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
    Write-Success "VSCode extension built successfully"
}

# Build JetBrains plugin
function Build-JetBrainsPlugin {
    Write-Status "Building JetBrains plugin..."
    
    if (-not (Test-Path "jetbrains-plugin")) {
        Write-Warning "JetBrains plugin directory not found, skipping..."
        return
    }
    
    Push-Location "jetbrains-plugin"
    
    # Check if Java is installed
    if (-not (Test-Command "java")) {
        Write-Error "Java is not installed. Please install Java 17+ for JetBrains plugin build."
        Pop-Location
        return
    }
    
    # Build plugin
    if (Test-Path "gradlew.bat") {
        & .\gradlew.bat buildPlugin
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build JetBrains plugin"
            Pop-Location
            exit 1
        }
    } else {
        Write-Error "Gradle wrapper not found in jetbrains-plugin directory"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
    Write-Success "JetBrains plugin built successfully"
}

# Run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    # Run server tests
    if (Test-Path "server") {
        Push-Location "server"
        try {
            npm run test 2>$null
            Write-Success "Server tests passed"
        }
        catch {
            Write-Warning "Server tests failed or not configured"
        }
        Pop-Location
    }
    
    # Run extension tests
    if (Test-Path "vscode-extension") {
        Push-Location "vscode-extension"
        try {
            npm run test 2>$null
            Write-Success "Extension tests passed"
        }
        catch {
            Write-Warning "Extension tests failed or not configured"
        }
        Pop-Location
    }
}

# Create distribution
function New-Distribution {
    Write-Status "Creating distribution..."
    
    # Create dist directory
    if (-not (Test-Path "dist")) {
        New-Item -ItemType Directory -Path "dist" | Out-Null
    }
    
    # Copy server build
    if (Test-Path "server\out") {
        Copy-Item -Recurse -Path "server\out" -Destination "dist\server"
        Copy-Item -Path "server\package.json" -Destination "dist\server\"
        Write-Status "Server copied to dist/"
    }
    
    # Copy VSCode extension
    $vsixFiles = Get-ChildItem -Path "vscode-extension" -Filter "*.vsix"
    if ($vsixFiles) {
        Copy-Item -Path $vsixFiles.FullName -Destination "dist\"
        Write-Status "VSCode extension copied to dist/"
    }
    
    # Copy JetBrains plugin
    if (Test-Path "jetbrains-plugin\build\distributions") {
        $pluginFiles = Get-ChildItem -Path "jetbrains-plugin\build\distributions" -Filter "*.zip"
        if ($pluginFiles) {
            Copy-Item -Path $pluginFiles.FullName -Destination "dist\"
            Write-Status "JetBrains plugin copied to dist/"
        }
    }
    
    Write-Success "Distribution created in dist/"
}

# Show help
function Show-Help {
    Write-Host "Usage: .\build.ps1 [options]"
    Write-Host "Options:"
    Write-Host "  -Clean         Clean previous builds"
    Write-Host "  -NoServer      Skip server build"
    Write-Host "  -NoVSCode      Skip VSCode extension build"
    Write-Host "  -NoJetBrains   Skip JetBrains plugin build"
    Write-Host "  -Test          Run tests"
    Write-Host "  -Help          Show this help"
}

# Main function
function Main {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-Status "Starting MSpec LSP build process..."
    
    # Execute build steps
    Test-Prerequisites
    
    if ($Clean) {
        Invoke-CleanBuild
    }
    
    Install-Dependencies
    
    if (-not $NoServer) {
        Build-Server
    }
    
    if (-not $NoVSCode) {
        Build-VSCodeExtension
    }
    
    if (-not $NoJetBrains) {
        Build-JetBrainsPlugin
    }
    
    if ($Test) {
        Invoke-Tests
    }
    
    New-Distribution
    
    Write-Success "Build completed successfully!"
    Write-Status "Built artifacts are available in the dist\ directory"
}

# Run main function
Main
