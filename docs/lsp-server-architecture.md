# MSpec LSP Server Architecture

## Overview

This document outlines the architecture for the MSpec Language Server Protocol (LSP) implementation, which will provide rich language support for PLC4X MSpec files in VSCode and JetBrains IDEs.

## Technology Stack

### Core Technologies
- **Language**: TypeScript/Node.js
- **LSP Framework**: `vscode-languageserver` and `vscode-languageserver-textdocument`
- **Parser**: Custom parser based on the ANTLR4 grammar or a hand-written recursive descent parser
- **Build Tool**: npm/yarn with TypeScript compiler
- **Testing**: Jest for unit tests, LSP test framework for integration tests

### Rationale for TypeScript/Node.js
1. **Cross-platform compatibility** - Works on Windows, macOS, and Linux
2. **Rich LSP ecosystem** - Excellent LSP libraries and tooling
3. **IDE integration** - Native support in VSCode, good support in JetBrains via LSP4J
4. **Development speed** - Rapid prototyping and iteration
5. **Community** - Large ecosystem and community support

## Project Structure

```
mspec-lsp/
├── server/                     # LSP Server implementation
│   ├── src/
│   │   ├── server.ts          # Main LSP server entry point
│   │   ├── parser/            # MSpec parser implementation
│   │   │   ├── lexer.ts       # Tokenizer for MSpec
│   │   │   ├── parser.ts      # Parser for MSpec syntax
│   │   │   ├── ast.ts         # Abstract Syntax Tree definitions
│   │   │   └── grammar.ts     # Grammar rules and keywords
│   │   ├── analyzer/          # Semantic analysis
│   │   │   ├── semantic-analyzer.ts
│   │   │   ├── type-checker.ts
│   │   │   ├── symbol-table.ts
│   │   │   └── diagnostics.ts
│   │   ├── features/          # LSP feature implementations
│   │   │   ├── completion.ts  # Auto-completion
│   │   │   ├── hover.ts       # Hover information
│   │   │   ├── definition.ts  # Go-to-definition
│   │   │   ├── references.ts  # Find references
│   │   │   ├── formatting.ts  # Document formatting
│   │   │   ├── validation.ts  # Syntax/semantic validation
│   │   │   └── highlighting.ts # Semantic highlighting
│   │   ├── utils/             # Utility functions
│   │   │   ├── position.ts    # Position/range utilities
│   │   │   ├── text-utils.ts  # Text manipulation
│   │   │   └── logger.ts      # Logging utilities
│   │   └── types/             # Type definitions
│   │       ├── mspec-types.ts # MSpec-specific types
│   │       └── lsp-types.ts   # LSP-related types
│   ├── package.json
│   ├── tsconfig.json
│   └── tests/                 # Server tests
├── vscode-extension/          # VSCode extension
│   ├── src/
│   │   ├── extension.ts       # Extension entry point
│   │   └── client.ts          # LSP client implementation
│   ├── syntaxes/
│   │   └── mspec.tmLanguage.json # TextMate grammar for syntax highlighting
│   ├── language-configuration.json
│   ├── package.json
│   └── README.md
├── jetbrains-plugin/          # JetBrains plugin
│   ├── src/main/
│   │   ├── kotlin/            # Plugin implementation in Kotlin
│   │   └── resources/
│   │       ├── META-INF/
│   │       │   └── plugin.xml
│   │       └── fileTypes/
│   │           └── mspec.xml
│   ├── build.gradle.kts
│   └── README.md
├── shared/                    # Shared utilities and types
│   ├── src/
│   │   ├── constants.ts       # Shared constants
│   │   └── types.ts           # Shared type definitions
│   └── package.json
├── examples/                  # Example MSpec files for testing
│   ├── s7.mspec
│   ├── modbus.mspec
│   └── simple-example.mspec
├── docs/                      # Documentation
├── package.json               # Root package.json for workspace
└── README.md
```

## Core Components

### 1. Parser Module

#### Lexer (`lexer.ts`)
- Tokenizes MSpec source code
- Handles keywords, identifiers, literals, operators, and delimiters
- Provides error recovery for malformed tokens

#### Parser (`parser.ts`)
- Implements recursive descent parser based on MSpec grammar
- Builds Abstract Syntax Tree (AST)
- Provides error recovery and meaningful error messages

#### AST (`ast.ts`)
- Defines node types for all MSpec constructs
- Includes position information for IDE features
- Supports visitor pattern for tree traversal

### 2. Semantic Analyzer

#### Symbol Table (`symbol-table.ts`)
- Tracks type definitions, field names, and scopes
- Resolves references between types
- Handles inheritance and type relationships

#### Type Checker (`type-checker.ts`)
- Validates type compatibility
- Checks expression types and constraints
- Validates field definitions and attributes

#### Diagnostics (`diagnostics.ts`)
- Collects and reports syntax and semantic errors
- Provides warnings for potential issues
- Generates helpful error messages with suggestions

### 3. LSP Features

#### Completion Provider (`completion.ts`)
- Context-aware auto-completion
- Suggests keywords, type names, field names
- Provides snippets for common patterns

#### Hover Provider (`hover.ts`)
- Shows type information on hover
- Displays documentation for built-in types
- Shows field definitions and constraints

#### Definition Provider (`definition.ts`)
- Go-to-definition for type references
- Navigate to field definitions
- Jump to enum value definitions

#### Validation (`validation.ts`)
- Real-time syntax validation
- Semantic error checking
- Integration with diagnostics system

## Language Features Support

### Syntax Highlighting
- **Keywords**: `type`, `discriminatedType`, `enum`, `dataIo`, field types
- **Types**: Built-in data types (`int`, `uint`, `string`, etc.)
- **Literals**: Numbers, strings, booleans, hex values
- **Operators**: Arithmetic, logical, comparison operators
- **Comments**: Line and block comments
- **Brackets**: Different colors for different bracket types

### Auto-completion
- **Context-aware suggestions**:
  - Field types after `[`
  - Data types in field definitions
  - Attribute names and values
  - Expression functions and operators
- **Snippets** for common patterns:
  - Type definitions
  - Field definitions
  - Enum definitions

### Validation
- **Syntax errors**: Malformed constructs, missing brackets
- **Semantic errors**: Undefined types, invalid expressions
- **Type errors**: Incompatible types, invalid field attributes
- **Best practices**: Warnings for potential issues

### Hover Information
- **Type information**: Show data type details
- **Field documentation**: Display field purpose and constraints
- **Expression evaluation**: Show expression types and values

### Go-to-Definition
- **Type references**: Jump to type definitions
- **Field references**: Navigate to field declarations
- **Enum values**: Go to enum value definitions

### Find References
- **Type usage**: Find all uses of a type
- **Field references**: Locate field usage
- **Symbol search**: Search for symbols across files

## Configuration

### Server Configuration
```json
{
  "mspec": {
    "validation": {
      "enabled": true,
      "strictMode": false
    },
    "completion": {
      "enabled": true,
      "snippets": true
    },
    "formatting": {
      "enabled": true,
      "indentSize": 4
    }
  }
}
```

### Extension Settings
- Enable/disable specific features
- Configure validation strictness
- Set formatting preferences
- Customize syntax highlighting colors

## Performance Considerations

### Incremental Parsing
- Parse only changed portions of documents
- Cache AST nodes for unchanged sections
- Efficient re-validation on document changes

### Memory Management
- Limit AST cache size
- Clean up unused document data
- Efficient symbol table storage

### Responsiveness
- Asynchronous parsing and analysis
- Debounced validation triggers
- Progressive completion suggestions

## Error Handling

### Parser Error Recovery
- Continue parsing after syntax errors
- Provide meaningful error messages
- Suggest corrections for common mistakes

### LSP Error Handling
- Graceful degradation when features fail
- Logging for debugging issues
- Fallback behaviors for partial functionality

## Testing Strategy

### Unit Tests
- Parser component tests
- Semantic analyzer tests
- Individual feature tests

### Integration Tests
- End-to-end LSP communication tests
- Multi-file project tests
- Performance benchmarks

### Manual Testing
- Real-world MSpec file testing
- IDE integration testing
- User experience validation

This architecture provides a solid foundation for implementing a comprehensive MSpec language server that can deliver rich IDE features across multiple platforms.
