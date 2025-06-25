#!/bin/bash

# Build script for MSpec Language Server and Extensions
# This script builds all components of the MSpec LSP project

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    
    # Clean root
    rm -rf node_modules package-lock.json
    
    # Clean server
    if [ -d "server" ]; then
        cd server
        rm -rf node_modules out package-lock.json
        cd ..
    fi
    
    # Clean VSCode extension
    if [ -d "vscode-extension" ]; then
        cd vscode-extension
        rm -rf node_modules out *.vsix package-lock.json
        cd ..
    fi
    
    # Clean JetBrains plugin
    if [ -d "jetbrains-plugin" ]; then
        cd jetbrains-plugin
        if [ -f "gradlew" ]; then
            ./gradlew clean
        fi
        cd ..
    fi
    
    print_success "Clean completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    print_success "Dependencies installed"
}

# Build language server
build_server() {
    print_status "Building language server..."
    
    cd server
    npm run build
    cd ..
    
    print_success "Language server built successfully"
}

# Build VSCode extension
build_vscode_extension() {
    print_status "Building VSCode extension..."
    
    cd vscode-extension
    
    # Install dependencies
    npm install
    
    # Compile TypeScript
    npm run compile
    
    # Install vsce if not present
    if ! command_exists vsce; then
        print_status "Installing vsce..."
        npm install -g @vscode/vsce
    fi
    
    # Package extension
    npm run package
    
    cd ..
    
    print_success "VSCode extension built successfully"
}

# Build JetBrains plugin
build_jetbrains_plugin() {
    print_status "Building JetBrains plugin..."
    
    if [ ! -d "jetbrains-plugin" ]; then
        print_warning "JetBrains plugin directory not found, skipping..."
        return
    fi
    
    cd jetbrains-plugin
    
    # Check if Java is installed
    if ! command_exists java; then
        print_error "Java is not installed. Please install Java 17+ for JetBrains plugin build."
        cd ..
        return 1
    fi
    
    # Build plugin
    if [ -f "gradlew" ]; then
        chmod +x gradlew
        ./gradlew buildPlugin
    else
        print_error "Gradle wrapper not found in jetbrains-plugin directory"
        cd ..
        return 1
    fi
    
    cd ..
    
    print_success "JetBrains plugin built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run server tests
    if [ -d "server" ]; then
        cd server
        if npm run test >/dev/null 2>&1; then
            print_success "Server tests passed"
        else
            print_warning "Server tests failed or not configured"
        fi
        cd ..
    fi
    
    # Run extension tests
    if [ -d "vscode-extension" ]; then
        cd vscode-extension
        if npm run test >/dev/null 2>&1; then
            print_success "Extension tests passed"
        else
            print_warning "Extension tests failed or not configured"
        fi
        cd ..
    fi
}

# Create distribution
create_distribution() {
    print_status "Creating distribution..."
    
    # Create dist directory
    mkdir -p dist
    
    # Copy server build
    if [ -d "server/out" ]; then
        cp -r server/out dist/server
        cp server/package.json dist/server/
        print_status "Server copied to dist/"
    fi
    
    # Copy VSCode extension
    if [ -f "vscode-extension"/*.vsix ]; then
        cp vscode-extension/*.vsix dist/
        print_status "VSCode extension copied to dist/"
    fi
    
    # Copy JetBrains plugin
    if [ -d "jetbrains-plugin/build/distributions" ]; then
        cp jetbrains-plugin/build/distributions/*.zip dist/ 2>/dev/null || true
        print_status "JetBrains plugin copied to dist/"
    fi
    
    print_success "Distribution created in dist/"
}

# Main build function
main() {
    print_status "Starting MSpec LSP build process..."
    
    # Parse command line arguments
    CLEAN=false
    BUILD_SERVER=true
    BUILD_VSCODE=true
    BUILD_JETBRAINS=true
    RUN_TESTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN=true
                shift
                ;;
            --no-server)
                BUILD_SERVER=false
                shift
                ;;
            --no-vscode)
                BUILD_VSCODE=false
                shift
                ;;
            --no-jetbrains)
                BUILD_JETBRAINS=false
                shift
                ;;
            --test)
                RUN_TESTS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --clean         Clean previous builds"
                echo "  --no-server     Skip server build"
                echo "  --no-vscode     Skip VSCode extension build"
                echo "  --no-jetbrains  Skip JetBrains plugin build"
                echo "  --test          Run tests"
                echo "  --help          Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute build steps
    check_prerequisites
    
    if [ "$CLEAN" = true ]; then
        clean_build
    fi
    
    install_dependencies
    
    if [ "$BUILD_SERVER" = true ]; then
        build_server
    fi
    
    if [ "$BUILD_VSCODE" = true ]; then
        build_vscode_extension
    fi
    
    if [ "$BUILD_JETBRAINS" = true ]; then
        build_jetbrains_plugin
    fi
    
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    create_distribution
    
    print_success "Build completed successfully!"
    print_status "Built artifacts are available in the dist/ directory"
}

# Run main function with all arguments
main "$@"
