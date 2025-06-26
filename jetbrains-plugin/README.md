# MSpec Language Support for JetBrains IDEs

This plugin provides language support for PLC4X MSpec files in JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, etc.).

## Features

- Syntax highlighting for MSpec files
- Code completion and auto-completion
- Error detection and validation
- Go to definition and find usages
- Code formatting and structure view
- File type recognition for `.mspec` files

## Installation

### From Plugin Package (Manual Installation)

1. **Download the Plugin Package**
   - Download the latest `jetbrains-plugin-*.zip` file from the [GitHub Releases](https://github.com/your-org/mspec-helper/releases)
   - Or build it locally using: `./gradlew buildPlugin`

2. **Install in JetBrains IDE**
   - Open your JetBrains IDE (IntelliJ IDEA, PyCharm, etc.)
   - Go to `File` → `Settings` (or `IntelliJ IDEA` → `Preferences` on macOS)
   - Navigate to `Plugins`
   - Click the gear icon (⚙️) and select `Install Plugin from Disk...`
   - Browse and select the downloaded `jetbrains-plugin-*.zip` file
   - Click `OK` and restart the IDE when prompted

3. **Verify Installation**
   - Create or open a `.mspec` file
   - The file should be recognized with syntax highlighting
   - Check that the file type is shown as "MSpec File" in the status bar

### From JetBrains Marketplace (Future)

*Note: This plugin is not yet published to the JetBrains Marketplace. Use manual installation for now.*

## Building from Source

### Prerequisites

- Java 17 or higher
- Gradle (included via wrapper)

### Build Steps

```bash
# Clone the repository
git clone https://github.com/your-org/mspec-helper.git
cd mspec-helper/jetbrains-plugin

# Build the plugin
./gradlew buildPlugin

# The plugin package will be created at:
# build/distributions/jetbrains-plugin-*.zip
```

### Development

```bash
# Run the plugin in a development IDE instance
./gradlew runIde

# Run tests
./gradlew test

# Verify plugin compatibility
./gradlew verifyPlugin
```

## Configuration

Currently, the plugin works out of the box with default settings. Future versions will include:

- Language server integration settings
- Custom syntax highlighting themes
- Code formatting preferences
- Validation rules configuration

## Supported IDEs

This plugin is compatible with:

- IntelliJ IDEA (Community and Ultimate) 2023.2+
- PyCharm (Community and Professional) 2023.2+
- WebStorm 2023.2+
- PhpStorm 2023.2+
- RubyMine 2023.2+
- CLion 2023.2+
- GoLand 2023.2+
- DataGrip 2023.2+
- Rider 2023.2+
- Android Studio (based on IntelliJ IDEA)

## Troubleshooting

### Plugin Not Loading

1. Ensure you're using a compatible IDE version (2023.2+)
2. Check that Java 17+ is installed and configured
3. Verify the plugin file is not corrupted
4. Check IDE logs: `Help` → `Show Log in Explorer/Finder`

### Syntax Highlighting Not Working

1. Verify the file has `.mspec` extension
2. Check if the file type is correctly detected
3. Try restarting the IDE
4. Reinstall the plugin if issues persist

### Performance Issues

1. Check IDE memory settings
2. Disable other plugins temporarily to isolate issues
3. Report performance issues with sample files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- GitHub Issues: [Report bugs and feature requests](https://github.com/your-org/mspec-helper/issues)
- Documentation: [Project Wiki](https://github.com/your-org/mspec-helper/wiki)
- PLC4X Community: [Apache PLC4X](https://plc4x.apache.org/)
