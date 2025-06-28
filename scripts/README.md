# Release Scripts

This directory contains scripts to help with creating GitHub releases for the MSpec Language Server project.

## Scripts

### `create-release.ps1` (PowerShell)
Creates a GitHub release with the VSCode extension package for Windows/PowerShell environments.

**Usage:**
```powershell
.\scripts\create-release.ps1 -Tag "v0.1.0-alpha" [-Token "your-github-token"]
```

### `create-release.sh` (Bash)
Creates a GitHub release with the VSCode extension package for Unix/Linux/macOS environments.

**Usage:**
```bash
./scripts/create-release.sh v0.1.0-alpha [github-token]
```

## Prerequisites

1. **Git tag**: The release tag must already exist and be pushed to GitHub
   ```bash
   git tag v0.1.0-alpha
   git push origin v0.1.0-alpha
   ```

2. **GitHub Personal Access Token**: You need a GitHub PAT with the following permissions:
   - `repo` (Full control of private repositories)
   - `write:packages` (Write packages to GitHub Package Registry)

3. **Dependencies**: Make sure all npm dependencies are installed
   ```bash
   npm install
   ```

## What the Scripts Do

1. **Validate** the tag format and existence
2. **Build** the project (`npm run build`)
3. **Package** the VSCode extension (`npm run package:vscode`)
4. **Extract** changelog content for the release
5. **Create** the GitHub release via API
6. **Upload** the VSIX file as a release asset

## GitHub Token Setup

### Creating a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` - Full control of private repositories
   - `write:packages` - Write packages to GitHub Package Registry
4. Copy the token and use it with the scripts

### Using the Token

**Option 1: Command line parameter**
```bash
./scripts/create-release.sh v0.1.0-alpha ghp_your_token_here
```

**Option 2: Interactive prompt** (more secure)
```bash
./scripts/create-release.sh v0.1.0-alpha
# You'll be prompted to enter the token securely
```

**Option 3: Environment variable**
```bash
export GITHUB_TOKEN=ghp_your_token_here
# Modify the script to use $GITHUB_TOKEN if preferred
```

## Troubleshooting

### 403 Forbidden Error
- Check that your GitHub token has the correct permissions
- Ensure the repository allows the token to create releases
- Verify that the token hasn't expired

### Tag Not Found Error
- Make sure you've created and pushed the tag:
  ```bash
  git tag v0.1.0-alpha
  git push origin v0.1.0-alpha
  ```

### Build Failures
- Ensure all dependencies are installed: `npm install`
- Check that the build works manually: `npm run build`
- Verify Node.js version is 18+ as required

### VSIX File Not Found
- Make sure the VSCode extension packaging succeeds: `npm run package:vscode`
- Check that the VSIX file exists in the `vscode-extension` directory

## Alternative: GitHub Actions

The repository also includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically creates releases when tags are pushed. The manual scripts are provided as a backup option or for local testing.

To use GitHub Actions instead:
1. Push your tag: `git push origin v0.1.0-alpha`
2. The workflow will automatically build and create the release
3. Check the Actions tab in GitHub for progress
