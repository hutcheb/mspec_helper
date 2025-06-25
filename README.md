# MSpec Language Server Protocol Implementation

A comprehensive Language Server Protocol (LSP) implementation for PLC4X MSpec files, providing rich language support in VSCode and JetBrains IDEs.

## Overview

MSpec (Message Specification) is a domain-specific language used by Apache PLC4X to define protocol message structures for industrial communication protocols. This project provides:

- **Language Server**: TypeScript/Node.js LSP server with full MSpec language support
- **VSCode Extension**: Rich editing experience for MSpec files in Visual Studio Code
- **JetBrains Plugin**: IntelliJ IDEA and other JetBrains IDEs support

## Features

### Language Server Features
- ✅ **Syntax Highlighting**: Full syntax highlighting for MSpec constructs
- ✅ **Auto-completion**: Context-aware completion for keywords, types, and fields
- ✅ **Error Detection**: Real-time syntax and semantic validation
- ✅ **Hover Information**: Detailed information on hover for types and fields
- ✅ **Go to Definition**: Navigate to type and field definitions
- ✅ **Document Formatting**: Automatic code formatting with configurable indentation
- ✅ **Code Snippets**: Pre-defined snippets for common MSpec patterns

### Supported MSpec Constructs
- Type definitions (`type`, `discriminatedType`, `enum`, `dataIo`)
- Field types (simple, array, const, reserved, optional, etc.)
- Data types (bit, byte, int, uint, float, string, etc.)
- Expressions and operators
- Type switching and discriminated unions
- Attributes and parameters

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Building from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/mspec-lsp.git
   cd mspec-lsp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

### VSCode Extension

#### From VSIX Package
1. Download the latest `.vsix` file from releases
2. Install using VSCode command palette:
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Run `Extensions: Install from VSIX...`
   - Select the downloaded `.vsix` file

#### From Source
1. Navigate to the VSCode extension directory:
   ```bash
   cd vscode-extension
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run compile
   ```

3. Package the extension:
   ```bash
   npm run package
   ```

4. Install the generated `.vsix` file in VSCode

### JetBrains Plugin

#### From Plugin Marketplace
1. Open IntelliJ IDEA
2. Go to `File > Settings > Plugins`
3. Search for "MSpec Language Support"
4. Install the plugin

#### From Source
1. Navigate to the JetBrains plugin directory:
   ```bash
   cd jetbrains-plugin
   ```

2. Build the plugin:
   ```bash
   ./gradlew buildPlugin
   ```

3. Install the generated plugin file from `build/distributions/`

## Configuration

### VSCode Settings

Configure the extension through VSCode settings:

```json
{
  "mspec.validation.enabled": true,
  "mspec.validation.strictMode": false,
  "mspec.completion.enabled": true,
  "mspec.completion.snippets": true,
  "mspec.formatting.enabled": true,
  "mspec.formatting.indentSize": 4,
  "mspec.server.path": "",
  "mspec.trace.server": "off"
}
```

### JetBrains Settings

Configure the plugin through IDE settings:
1. Go to `File > Settings > Languages & Frameworks > MSpec`
2. Adjust validation, completion, and formatting options

## Usage

### Creating MSpec Files

1. Create a new file with `.mspec` extension
2. Start typing MSpec definitions
3. Use auto-completion (`Ctrl+Space`) for suggestions
4. Use snippets for quick scaffolding

### Example MSpec File

```mspec
[type SimpleMessage byteOrder='BIG_ENDIAN'
    [const uint 8 messageType 0x01]
    [simple uint 16 messageId]
    [implicit uint 16 payloadLength 'payload.lengthInBytes']
    [array byte payload count 'payloadLength']
]

[enum uint 8 MessageType
    ['0x01' REQUEST]
    ['0x02' RESPONSE]
    ['0x03' ERROR]
]

[discriminatedType ProtocolMessage
    [discriminator uint 8 messageType]
    [typeSwitch messageType
        ['0x01' RequestMessage
            [simple string 32 command]
        ]
        ['0x02' ResponseMessage
            [simple uint 8 status]
        ]
    ]
]
```

### Available Commands

#### VSCode
- `MSpec: Restart Language Server` - Restart the language server
- `MSpec: Show Output` - Show language server output

#### JetBrains
- `File > New > MSpec File` - Create new MSpec file
- Standard IDE navigation and refactoring commands

## Development

### Project Structure

```
mspec-lsp/
├── server/                 # LSP Server (TypeScript)
│   ├── src/
│   │   ├── server.ts      # Main server entry point
│   │   ├── parser/        # MSpec parser and lexer
│   │   ├── analyzer/      # Semantic analysis
│   │   └── features/      # LSP feature implementations
│   └── tests/             # Server tests
├── vscode-extension/      # VSCode extension
│   ├── src/               # Extension source code
│   ├── syntaxes/          # TextMate grammar
│   └── snippets/          # Code snippets
├── jetbrains-plugin/      # JetBrains plugin
│   └── src/main/kotlin/   # Plugin source code
├── examples/              # Example MSpec files
└── docs/                  # Documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run server tests only
npm run test --workspace=server

# Run extension tests
npm run test --workspace=vscode-extension
```

### Development Setup

1. **Start the language server in development mode**:
   ```bash
   cd server
   npm run dev
   ```

2. **Debug VSCode extension**:
   - Open the project in VSCode
   - Go to Run and Debug view (`Ctrl+Shift+D`)
   - Select "Launch Extension" configuration
   - Press F5 to start debugging

3. **Debug JetBrains plugin**:
   ```bash
   cd jetbrains-plugin
   ./gradlew runIde
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript/ESLint rules for server and VSCode extension
- Follow Kotlin coding conventions for JetBrains plugin
- Use meaningful commit messages
- Add tests for new features

## Troubleshooting

### Common Issues

1. **Language server not starting**:
   - Check Node.js version (18+ required)
   - Verify server path in settings
   - Check output channel for error messages

2. **No syntax highlighting**:
   - Ensure file has `.mspec` extension
   - Restart VSCode/IDE after installation

3. **Auto-completion not working**:
   - Check if completion is enabled in settings
   - Verify language server is running
   - Try restarting the language server

### Debug Information

Enable debug logging:
- VSCode: Set `"mspec.trace.server": "verbose"`
- Check output channels for detailed logs

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Apache PLC4X](https://plc4x.apache.org/) for the MSpec language specification
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) specification
- [VSCode Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [JetBrains Plugin Development](https://plugins.jetbrains.com/docs/intellij/welcome.html)

## Related Projects

- [Apache PLC4X](https://github.com/apache/plc4x) - The main PLC4X project
- [PLC4X Documentation](https://plc4x.apache.org/plc4x/latest/) - Official PLC4X documentation
