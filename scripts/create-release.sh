#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Repository information
REPO_OWNER="hutcheb"
REPO_NAME="mspec_helper"

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <tag> [github-token]"
    echo "Example: $0 v0.1.0-alpha"
    echo "If github-token is not provided, you will be prompted for it."
    exit 1
}

# Check arguments
if [ $# -lt 1 ]; then
    show_usage
fi

TAG="$1"
TOKEN="$2"

# Validate tag format
if [[ ! $TAG =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    print_color $RED "Error: Tag must be in format v0.0.0 or v0.0.0-alpha"
    exit 1
fi

print_color $GREEN "Creating release for tag: $TAG"

# Get GitHub token if not provided
if [ -z "$TOKEN" ]; then
    read -s -p "Enter your GitHub Personal Access Token: " TOKEN
    echo
fi

# Check if tag exists
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
    print_color $RED "Error: Tag $TAG does not exist. Please create the tag first with:"
    print_color $WHITE "git tag $TAG && git push origin $TAG"
    exit 1
fi

# Build the project
print_color $YELLOW "Building project..."
if ! npm run build; then
    print_color $RED "Error: Build failed"
    exit 1
fi

# Package VSCode extension
print_color $YELLOW "Packaging VSCode extension..."
if ! npm run package:vscode; then
    print_color $RED "Error: VSCode extension packaging failed"
    exit 1
fi

# Find the VSIX file
VSIX_FILE=$(find vscode-extension -name "*.vsix" -type f | head -n 1)
if [ -z "$VSIX_FILE" ]; then
    print_color $RED "Error: No VSIX file found in vscode-extension directory"
    exit 1
fi

print_color $GREEN "Found VSIX file: $(basename "$VSIX_FILE")"

# Extract changelog for this version
CHANGELOG_CONTENT=""
if [ -f "CHANGELOG.md" ]; then
    VERSION_WITHOUT_V="${TAG#v}"
    CHANGELOG_CONTENT=$(sed -n "/^## \[$VERSION_WITHOUT_V\]/,/^## \[/p" CHANGELOG.md | head -n -1 | tail -n +2)
fi

if [ -z "$CHANGELOG_CONTENT" ]; then
    CHANGELOG_CONTENT="Release $TAG"
fi

# Determine if this is a prerelease
IS_PRERELEASE="false"
if [[ $TAG == *"-"* ]]; then
    IS_PRERELEASE="true"
fi

# Create release JSON
RELEASE_JSON=$(cat <<EOF
{
  "tag_name": "$TAG",
  "name": "MSpec Language Support $TAG",
  "body": $(echo "$CHANGELOG_CONTENT" | jq -R -s .),
  "draft": false,
  "prerelease": $IS_PRERELEASE
}
EOF
)

print_color $YELLOW "Creating GitHub release..."

# Create the release
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/release_response.json \
    -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "User-Agent: MSpec-Release-Script" \
    -d "$RELEASE_JSON" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases")

HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" != "201" ]; then
    print_color $RED "Error: Failed to create release (HTTP $HTTP_CODE)"
    cat /tmp/release_response.json
    exit 1
fi

# Parse response
RELEASE_URL=$(jq -r '.html_url' /tmp/release_response.json)
UPLOAD_URL=$(jq -r '.upload_url' /tmp/release_response.json | sed 's/{?name,label}//')

print_color $GREEN "Release created successfully: $RELEASE_URL"

# Upload the VSIX file
print_color $YELLOW "Uploading VSIX file..."
VSIX_NAME=$(basename "$VSIX_FILE")
UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/upload_response.json \
    -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Content-Type: application/zip" \
    -H "User-Agent: MSpec-Release-Script" \
    --data-binary "@$VSIX_FILE" \
    "${UPLOAD_URL}?name=${VSIX_NAME}")

UPLOAD_HTTP_CODE="${UPLOAD_RESPONSE: -3}"

if [ "$UPLOAD_HTTP_CODE" != "201" ]; then
    print_color $RED "Error: Failed to upload VSIX file (HTTP $UPLOAD_HTTP_CODE)"
    cat /tmp/upload_response.json
    exit 1
fi

print_color $GREEN "VSIX file uploaded successfully"

# Show summary
print_color $CYAN "\nRelease Summary:"
print_color $WHITE "- Release URL: $RELEASE_URL"
print_color $WHITE "- Tag: $TAG"
print_color $WHITE "- Prerelease: $IS_PRERELEASE"
VSIX_SIZE=$(du -h "$VSIX_FILE" | cut -f1)
print_color $WHITE "- VSIX File: $VSIX_NAME ($VSIX_SIZE)"

print_color $GREEN "\nRelease created successfully! 🎉"

# Cleanup
rm -f /tmp/release_response.json /tmp/upload_response.json
