#!/bin/bash
# Build script for VSCode extension with bundled language server

echo "Building MSpec VSCode Extension..."

# Step 1: Build and bundle the language server
echo "Building language server..."
cd ../server
npm run bundle
if [ $? -ne 0 ]; then
    echo "Failed to build language server"
    exit 1
fi

# Step 2: Copy bundled server to extension directory
echo "Copying bundled server..."
cd ../vscode-extension
mkdir -p server
cp ../server/out/server-bundled.js server/server-bundled.js

# Step 3: Build the extension
echo "Building extension..."
npm run compile
if [ $? -ne 0 ]; then
    echo "Failed to build extension"
    exit 1
fi

# Step 4: Package the extension
echo "Packaging extension..."
npm run package
if [ $? -ne 0 ]; then
    echo "Failed to package extension"
    exit 1
fi

echo "Extension built successfully!"
echo "VSIX file: mspec-language-support-1.0.0.vsix"
