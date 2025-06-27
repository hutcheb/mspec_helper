# MSpec Extension Troubleshooting Guide

## Go-to-Definition and Formatting Not Working

If the go-to-definition and formatting features aren't working after installing the VSIX, follow these steps:

### 1. Check Extension Installation
- Verify the extension is installed: `code --list-extensions | grep mspec`
- If not installed, install with: `code --install-extension mspec-language-support-1.0.0.vsix`

### 2. Check Language Server Status
1. Open a `.mspec` file
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run: `MSpec: Show MSpec Output`
4. Check for these messages:
   - "MSpec Language Support extension activated"
   - "MSpec Language Server started successfully"
   - Server capabilities should show:
     - Definition Provider: true
     - Formatting Provider: true

### 3. Verify File Association
- Ensure your file has the `.mspec` extension
- Check the language mode in the bottom-right corner of VSCode shows "MSpec"
- If not, click on the language mode and select "MSpec"

### 4. Test LSP Features

#### Go-to-Definition:
1. Place cursor on a type reference (e.g., `SimpleMessage`)
2. Right-click → "Go to Definition" OR press `F12`
3. Alternative: Use Command Palette → `MSpec: Go to Definition`

#### Formatting:
1. Open a `.mspec` file
2. Right-click → "Format Document" OR press `Shift+Alt+F`
3. Alternative: Use Command Palette → `MSpec: Format Document`

### 5. Restart Language Server
If features still don't work:
1. Command Palette → `MSpec: Restart MSpec Language Server`
2. Or reload VSCode window: `Developer: Reload Window`

### 6. Check for Errors
1. Open Developer Console: `Help` → `Toggle Developer Tools`
2. Check Console tab for any errors
3. Look in the MSpec output channel for error messages

### 7. Manual Commands
The extension provides these commands in the Command Palette:
- `MSpec: Go to Definition`
- `MSpec: Format Document`
- `MSpec: Restart MSpec Language Server`
- `MSpec: Show MSpec Output`

### 8. Common Issues

#### "Language server not found" error:
- The bundled server file is missing
- Reinstall the extension

#### "MSpec Language Server is not running" warning:
- Server failed to start
- Check the output channel for error details
- Try restarting the server

#### Features work in development but not in VSIX:
- Server dependencies might be missing
- Rebuild with: `npm run build-full`

### 9. Debug Mode
To enable verbose logging:
1. Open VSCode settings
2. Search for "mspec.trace.server"
3. Set to "verbose"
4. Restart the language server

### 10. File a Bug Report
If issues persist, include:
- VSCode version
- Extension version
- Contents of MSpec output channel
- Sample `.mspec` file that reproduces the issue
- Steps to reproduce
