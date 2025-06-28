# Changelog

All notable changes to the MSpec Language Server project will be documented in
this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Planned features for future releases

## [0.1.0-alpha] - 2025-06-28

### Added

- Initial implementation of MSpec Language Server Protocol
- VSCode extension with comprehensive language support
- JetBrains plugin foundation for IntelliJ IDEA and other JetBrains IDEs
- Complete MSpec grammar support based on PLC4X ANTLR4 grammar
- Syntax highlighting for all MSpec constructs
- Auto-completion with context-aware suggestions
- Real-time validation and error detection
- Hover information for types, fields, and keywords
- Go-to-definition functionality
- Document formatting with configurable indentation
- Code snippets for common MSpec patterns
- Support for all MSpec field types and data types
- Type switching and discriminated union support
- Expression parsing and validation
- Comprehensive test suite
- Build automation with GitHub Actions
- Cross-platform support (Windows, macOS, Linux)

### Known Issues

- JetBrains plugin requires additional LSP dependencies (will be addressed in
  future releases)
- Some advanced language features may be incomplete in this alpha release

### Language Server Features

- **Lexer**: Complete tokenization of MSpec syntax
- **Parser**: Recursive descent parser with error recovery
- **Semantic Analysis**: Symbol table management and type checking
- **Completion Provider**: Context-aware auto-completion
- **Hover Provider**: Rich hover information with documentation
- **Definition Provider**: Go-to-definition for types and fields
- **Validation Provider**: Real-time syntax and semantic validation
- **Formatting Provider**: Automatic code formatting

### VSCode Extension Features

- **Syntax Highlighting**: TextMate grammar for MSpec files
- **Language Configuration**: Bracket matching, auto-closing pairs
- **Code Snippets**: Pre-defined snippets for common patterns
- **Commands**: Restart server, show output channel
- **Settings**: Configurable validation, completion, and formatting
- **File Association**: Automatic detection of .mspec files

### JetBrains Plugin Features

- **File Type Support**: Recognition of .mspec files
- **LSP Integration**: Communication with MSpec language server
- **Syntax Highlighting**: Native IntelliJ syntax highlighting
- **Code Completion**: Integration with IntelliJ completion system
- **Error Highlighting**: Real-time error detection and display
- **Plugin Configuration**: Settings for server path and options

### Documentation

- Comprehensive README with installation and usage instructions
- Installation guide for all platforms
- Contributing guidelines for developers
- Architecture documentation
- Example MSpec files for testing and learning

### Build and Development

- Multi-platform build scripts (Bash and PowerShell)
- GitHub Actions CI/CD pipeline
- Automated testing and linting
- VSCode debugging configuration
- Development environment setup
- Package and distribution automation

## [1.0.0] - TBD

### Added

- Initial stable release
- Full MSpec language support
- VSCode and JetBrains extensions
- Comprehensive documentation
- Production-ready build system

---

## Release Notes Template

### [Version] - Date

#### Added

- New features and capabilities

#### Changed

- Changes to existing functionality

#### Deprecated

- Features that will be removed in future versions

#### Removed

- Features that have been removed

#### Fixed

- Bug fixes and corrections

#### Security

- Security-related changes and fixes
