# Contributing to MSpec Language Server

Thank you for your interest in contributing to the MSpec Language Server project! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- VSCode (recommended for development)
- Java 17+ (for JetBrains plugin development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/mspec-lsp.git
   cd mspec-lsp
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/your-org/mspec-lsp.git
   ```

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Start development**:
   ```bash
   # Start language server in watch mode
   cd server
   npm run watch
   ```

4. **Debug in VSCode**:
   - Open the project in VSCode
   - Use the provided launch configurations in `.vscode/launch.json`
   - Set breakpoints and start debugging

## Project Structure

```
mspec-lsp/
├── server/                 # Language Server (TypeScript)
│   ├── src/
│   │   ├── server.ts      # Main server entry point
│   │   ├── parser/        # Lexer and parser
│   │   ├── analyzer/      # Semantic analysis
│   │   ├── features/      # LSP feature implementations
│   │   └── types/         # Type definitions
│   └── tests/             # Server tests
├── vscode-extension/      # VSCode extension
│   ├── src/               # Extension source
│   ├── syntaxes/          # TextMate grammar
│   └── snippets/          # Code snippets
├── jetbrains-plugin/      # JetBrains plugin (Kotlin)
│   └── src/main/kotlin/   # Plugin source
├── examples/              # Example MSpec files
├── docs/                  # Documentation
└── scripts/               # Build scripts
```

## Development Workflow

### Branching Strategy

- `main`: Stable release branch
- `develop`: Development branch for next release
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical fixes for production

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write code following the project conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We use conventional commits for clear and consistent commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add hover support for enum values
fix: resolve completion issue in type switch
docs: update installation guide
test: add parser tests for discriminated types
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run server tests only
npm run test --workspace=server

# Run tests in watch mode
npm run test:watch --workspace=server

# Run tests with coverage
npm run test:coverage --workspace=server
```

### Writing Tests

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test component interactions
- **End-to-end tests**: Test complete workflows

Example test structure:
```typescript
describe('MSpec Parser', () => {
  describe('Type Definitions', () => {
    test('should parse simple type definition', () => {
      // Test implementation
    });
  });
});
```

### Test Guidelines

- Write tests for all new functionality
- Maintain or improve test coverage
- Use descriptive test names
- Include both positive and negative test cases
- Test error conditions and edge cases

## Code Style

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### Kotlin (JetBrains Plugin)

- Follow Kotlin coding conventions
- Use meaningful class and method names
- Add KDoc comments for public APIs
- Use data classes where appropriate

### Formatting

- Use Prettier for code formatting
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas where supported

### Running Linting

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Push your changes**:
   ```bash
   git push origin your-feature-branch
   ```

3. **Create a Pull Request**:
   - Go to GitHub and create a PR from your branch to `develop`
   - Fill out the PR template completely
   - Link any related issues

### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Documentation**: Update docs if needed
- **Breaking Changes**: Clearly mark any breaking changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Release Process

### Version Numbering

We use Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Steps

1. **Prepare release branch**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b release/v1.2.0
   ```

2. **Update version numbers**:
   - Update `package.json` files
   - Update extension manifests
   - Update documentation

3. **Create release PR**:
   - PR from release branch to `main`
   - Include changelog
   - Get approval from maintainers

4. **Tag and release**:
   - Merge to `main`
   - Create Git tag
   - GitHub Actions will build and publish

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Request Reviews**: Code-specific discussions

### Documentation

- **README.md**: Project overview and quick start
- **docs/**: Detailed documentation
- **Code Comments**: Inline documentation
- **Tests**: Examples of usage

### Maintainer Contact

For questions about contributing, reach out to the maintainers through:
- GitHub issues (preferred)
- GitHub discussions
- Email (for sensitive matters)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributor graphs

Thank you for contributing to the MSpec Language Server project!
