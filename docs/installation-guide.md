# MSpec Language Server Installation Guide

This guide provides detailed instructions for installing and configuring the MSpec Language Server and its extensions.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **Memory**: At least 4GB RAM recommended
- **Disk Space**: 500MB for full installation

### Development Tools (Optional)
- **Git**: For cloning the repository
- **VSCode**: Version 1.75.0 or higher
- **IntelliJ IDEA**: Version 2023.2 or higher (for JetBrains plugin)

## Installation Methods

### Method 1: Pre-built Packages (Recommended)

#### VSCode Extension

1. **From VS Marketplace**:
   - Open VSCode
   - Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Search for "MSpec Language Support"
   - Click "Install"

2. **From VSIX File**:
   - Download the latest `.vsix` file from [releases](https://github.com/your-org/mspec-lsp/releases)
   - Open VSCode Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run `Extensions: Install from VSIX...`
   - Select the downloaded `.vsix` file

#### JetBrains Plugin

1. **From JetBrains Marketplace**:
   - Open IntelliJ IDEA
   - Go to `File > Settings > Plugins` (Windows/Linux) or `IntelliJ IDEA > Preferences > Plugins` (macOS)
   - Click "Marketplace" tab
   - Search for "MSpec Language Support"
   - Click "Install"

2. **From Plugin File**:
   - Download the latest plugin `.zip` file from releases
   - Go to `File > Settings > Plugins`
   - Click gear icon and select "Install Plugin from Disk..."
   - Select the downloaded plugin file

### Method 2: Build from Source

#### Prerequisites for Building
```bash
# Install Node.js (if not already installed)
# Visit https://nodejs.org/ for installation instructions

# Verify installation
node --version  # Should be 18.0+
npm --version   # Should be 8.0+
```

#### Clone and Build

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-org/mspec-lsp.git
   cd mspec-lsp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build All Components**:
   ```bash
   npm run build
   ```

#### Build VSCode Extension

1. **Navigate to Extension Directory**:
   ```bash
   cd vscode-extension
   ```

2. **Install Extension Dependencies**:
   ```bash
   npm install
   ```

3. **Compile Extension**:
   ```bash
   npm run compile
   ```

4. **Package Extension**:
   ```bash
   npm install -g @vscode/vsce  # Install packaging tool
   npm run package
   ```

5. **Install Generated VSIX**:
   ```bash
   code --install-extension mspec-language-support-1.0.0.vsix
   ```

#### Build JetBrains Plugin

1. **Navigate to Plugin Directory**:
   ```bash
   cd jetbrains-plugin
   ```

2. **Build Plugin**:
   ```bash
   ./gradlew buildPlugin
   ```

3. **Install Plugin**:
   - The built plugin will be in `build/distributions/`
   - Install manually through IntelliJ IDEA settings

## Configuration

### VSCode Configuration

#### Basic Settings
Add these settings to your VSCode `settings.json`:

```json
{
  "mspec.validation.enabled": true,
  "mspec.validation.strictMode": false,
  "mspec.completion.enabled": true,
  "mspec.completion.snippets": true,
  "mspec.formatting.enabled": true,
  "mspec.formatting.indentSize": 4,
  "mspec.trace.server": "off"
}
```

#### Advanced Settings

```json
{
  "mspec.server.path": "/custom/path/to/mspec-language-server",
  "mspec.server.args": ["--custom-arg"],
  "mspec.validation.strictMode": true,
  "mspec.completion.snippets": false,
  "mspec.formatting.indentSize": 2,
  "mspec.trace.server": "verbose"
}
```

#### File Associations
Ensure `.mspec` files are associated with the MSpec language:

```json
{
  "files.associations": {
    "*.mspec": "mspec"
  }
}
```

### JetBrains Configuration

#### Plugin Settings
1. Go to `File > Settings > Languages & Frameworks > MSpec`
2. Configure the following options:
   - **Validation**: Enable/disable syntax and semantic validation
   - **Completion**: Configure auto-completion behavior
   - **Formatting**: Set indentation and formatting preferences
   - **Language Server**: Configure LSP server path and arguments

#### Code Style Settings
1. Go to `File > Settings > Editor > Code Style > MSpec`
2. Configure:
   - **Indentation**: Tab size and indent size
   - **Spaces**: Around operators, brackets, etc.
   - **Wrapping**: Line wrapping preferences

## Verification

### Test Installation

1. **Create Test File**:
   Create a new file named `test.mspec` with the following content:
   ```mspec
   [type TestMessage
       [simple uint 8 messageType]
       [simple uint 16 messageId]
   ]
   ```

2. **Verify Features**:
   - **Syntax Highlighting**: Keywords should be highlighted
   - **Auto-completion**: Type `[` and verify completion suggestions
   - **Validation**: Introduce a syntax error and verify error highlighting
   - **Hover**: Hover over keywords to see documentation

### Troubleshooting

#### Common Issues

1. **Language Server Not Starting**:
   ```bash
   # Check Node.js version
   node --version
   
   # Check if server executable exists
   which mspec-language-server
   
   # Check VSCode output
   # View > Output > Select "MSpec Language Server"
   ```

2. **No Syntax Highlighting**:
   - Verify file extension is `.mspec`
   - Check if extension is enabled
   - Restart VSCode/IDE

3. **Auto-completion Not Working**:
   - Check if completion is enabled in settings
   - Verify language server is running
   - Try restarting the language server

4. **Permission Issues (Linux/macOS)**:
   ```bash
   # Make server executable
   chmod +x /path/to/mspec-language-server
   
   # Fix npm permissions
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```

#### Debug Mode

**VSCode**:
1. Set `"mspec.trace.server": "verbose"` in settings
2. Open Output panel (`View > Output`)
3. Select "MSpec Language Server" from dropdown
4. Check for error messages

**JetBrains**:
1. Enable debug logging in plugin settings
2. Check IDE logs: `Help > Show Log in Explorer/Finder`
3. Look for MSpec-related error messages

## Uninstallation

### VSCode Extension
1. Go to Extensions view (`Ctrl+Shift+X`)
2. Find "MSpec Language Support"
3. Click "Uninstall"

### JetBrains Plugin
1. Go to `File > Settings > Plugins`
2. Find "MSpec Language Support"
3. Click "Uninstall"

### Language Server (if installed globally)
```bash
npm uninstall -g mspec-language-server
```

## Updates

### Automatic Updates
- **VSCode**: Extensions update automatically by default
- **JetBrains**: Plugins update automatically if enabled in settings

### Manual Updates
- **VSCode**: Check for updates in Extensions view
- **JetBrains**: Check for updates in Plugin settings
- **Source Build**: Pull latest changes and rebuild

## Support

### Getting Help
- **Documentation**: [GitHub Wiki](https://github.com/your-org/mspec-lsp/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/mspec-lsp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mspec-lsp/discussions)

### Reporting Issues
When reporting issues, please include:
- Operating system and version
- VSCode/IDE version
- Extension/plugin version
- Language server logs
- Minimal reproduction case

### Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup and contribution guidelines.
