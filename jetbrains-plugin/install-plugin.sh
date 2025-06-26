#!/bin/bash

# MSpec JetBrains Plugin Installation Script
# This script helps install the MSpec plugin in JetBrains IDEs on Linux/macOS

PLUGIN_PATH=""
TARGET_IDE=""
SHOW_HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--plugin-path)
            PLUGIN_PATH="$2"
            shift 2
            ;;
        -i|--ide)
            TARGET_IDE="$2"
            shift 2
            ;;
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

show_help() {
    echo "MSpec JetBrains Plugin Installation Script"
    echo ""
    echo "Usage:"
    echo "  ./install-plugin.sh -p <path-to-zip> [-i <ide-name>]"
    echo ""
    echo "Parameters:"
    echo "  -p, --plugin-path   Path to the plugin ZIP file"
    echo "  -i, --ide          Specific IDE to install to (optional)"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./install-plugin.sh -p ./build/distributions/jetbrains-plugin-1.0.0.zip"
    echo "  ./install-plugin.sh -p ./plugin.zip -i IntelliJIdea"
    echo ""
    echo "Supported IDEs:"
    echo "  - IntelliJIdea"
    echo "  - PyCharm"
    echo "  - WebStorm"
    echo "  - PhpStorm"
    echo "  - RubyMine"
    echo "  - CLion"
    echo "  - GoLand"
    echo "  - DataGrip"
    echo "  - Rider"
}

find_jetbrains_ides() {
    local ides=()
    local config_dirs=()
    
    # Determine config directories based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        config_dirs+=("$HOME/Library/Application Support/JetBrains")
        config_dirs+=("$HOME/Library/Preferences")
    else
        # Linux
        config_dirs+=("$HOME/.config/JetBrains")
        config_dirs+=("$HOME/.local/share/JetBrains")
    fi
    
    # IDE patterns to search for
    local ide_patterns=("IntelliJIdea*" "PyCharm*" "WebStorm*" "PhpStorm*" "RubyMine*" "CLion*" "GoLand*" "DataGrip*" "Rider*")
    
    for config_dir in "${config_dirs[@]}"; do
        if [[ -d "$config_dir" ]]; then
            for pattern in "${ide_patterns[@]}"; do
                for ide_dir in "$config_dir"/$pattern; do
                    if [[ -d "$ide_dir" ]]; then
                        local ide_name=$(basename "$ide_dir")
                        local plugins_dir="$ide_dir/plugins"
                        ides+=("$ide_name|$ide_dir|$plugins_dir")
                    fi
                done
            done
        fi
    done
    
    printf '%s\n' "${ides[@]}"
}

install_plugin() {
    local plugin_zip="$1"
    local target_ide="$2"
    
    if [[ ! -f "$plugin_zip" ]]; then
        echo "Error: Plugin file not found: $plugin_zip" >&2
        return 1
    fi
    
    local ides
    mapfile -t ides < <(find_jetbrains_ides)
    
    if [[ ${#ides[@]} -eq 0 ]]; then
        echo "Warning: No JetBrains IDEs found in standard locations."
        echo "Please install the plugin manually:"
        echo "1. Open your JetBrains IDE"
        echo "2. Go to File → Settings → Plugins"
        echo "3. Click gear icon → Install Plugin from Disk"
        echo "4. Select: $plugin_zip"
        return 1
    fi
    
    echo "Found JetBrains IDEs:"
    local i=0
    for ide_info in "${ides[@]}"; do
        IFS='|' read -r ide_name ide_path plugins_path <<< "$ide_info"
        echo "  [$i] $ide_name"
        ((i++))
    done
    
    local target_ides=()
    
    if [[ -n "$target_ide" ]]; then
        for ide_info in "${ides[@]}"; do
            IFS='|' read -r ide_name ide_path plugins_path <<< "$ide_info"
            if [[ "$ide_name" == *"$target_ide"* ]]; then
                target_ides+=("$ide_info")
            fi
        done
        
        if [[ ${#target_ides[@]} -eq 0 ]]; then
            echo "Error: IDE '$target_ide' not found." >&2
            return 1
        fi
    else
        echo ""
        read -p "Enter IDE number to install to (or 'all' for all IDEs): " choice
        
        if [[ "$choice" == "all" ]]; then
            target_ides=("${ides[@]}")
        elif [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -lt ${#ides[@]} ]]; then
            target_ides=("${ides[$choice]}")
        else
            echo "Error: Invalid choice." >&2
            return 1
        fi
    fi
    
    for ide_info in "${target_ides[@]}"; do
        IFS='|' read -r ide_name ide_path plugins_path <<< "$ide_info"
        echo "Installing plugin to $ide_name..."
        
        # Ensure plugins directory exists
        mkdir -p "$plugins_path"
        
        # Extract plugin to plugins directory
        local plugin_name=$(basename "$plugin_zip" .zip)
        local extract_path="$plugins_path/$plugin_name"
        
        # Remove existing plugin if present
        if [[ -d "$extract_path" ]]; then
            rm -rf "$extract_path"
        fi
        
        # Extract new plugin
        if command -v unzip >/dev/null 2>&1; then
            if unzip -q "$plugin_zip" -d "$extract_path"; then
                echo "  ✓ Plugin installed successfully"
            else
                echo "  ✗ Failed to extract plugin" >&2
            fi
        else
            echo "  ✗ unzip command not found. Please install unzip or extract manually." >&2
        fi
    done
    
    echo ""
    echo "Installation complete!"
    echo "Please restart your JetBrains IDE(s) to activate the plugin."
    
    return 0
}

# Main script execution
if [[ "$SHOW_HELP" == true ]]; then
    show_help
    exit 0
fi

if [[ -z "$PLUGIN_PATH" ]]; then
    # Try to find the plugin in the build directory
    local build_plugin="./build/distributions/jetbrains-plugin-*.zip"
    local found=$(ls $build_plugin 2>/dev/null | head -n 1)
    
    if [[ -n "$found" ]]; then
        PLUGIN_PATH="$found"
        echo "Found plugin: $PLUGIN_PATH"
    else
        echo "Error: Plugin path not specified and no plugin found in build directory." >&2
        echo "Use --help for usage information."
        exit 1
    fi
fi

install_plugin "$PLUGIN_PATH" "$TARGET_IDE"
