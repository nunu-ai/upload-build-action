# Upload Build to nunu.ai

GitHub Action to upload build artifacts to nunu.ai for automated testing.

## Quick Start
```yaml
- name: Upload to nunu.ai
  uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app.apk'
    name: 'Build ${{ github.run_number }}'
```

## Setup

### 1. Get API Token

Get your API token from **Project Admin → API Keys** in nunu.ai with the `project:manage-build-storage` permission.

### 2. Add Secrets

In your repository **Settings → Secrets and variables → Actions**:

- Add `NUNU_API_TOKEN` with your API token
- Add `NUNU_PROJECT_ID` with your project ID

### 3. Use the Action
```yaml
name: Build and Upload

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: ./build.sh
      
      - name: Upload to nunu.ai
        uses: nunu-ai/upload-build-action@v1
        with:
          api-token: ${{ secrets.NUNU_API_TOKEN }}
          project-id: ${{ secrets.NUNU_PROJECT_ID }}
          file: 'build/app.apk'
          name: 'Build ${{ github.run_number }}'
```

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `api-token` | nunu.ai API token |
| `project-id` | nunu.ai project ID |
| `file` | Path to build file or glob pattern |

### Optional

| Input | Default | Description |
|-------|---------|-------------|
| `name` | `Build {run_number}` | Build name |
| `platform` | Auto-detected | Target platform |
| `description` | - | Build description |
| `auto-delete` | `false` | Auto-delete old builds when storage full |
| `deletion-policy` | `least_recent` | `least_recent` or `oldest` |
| `upload-timeout` | Auto | Timeout in minutes (1-1440) |
| `tags` | - | Comma-separated tags |
| `cli-version` | `latest` | nunu-cli version |

## Outputs

| Output | Description |
|--------|-------------|
| `build-id` | UUID of uploaded build |

## Examples

### Single File
```yaml
- uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app.apk'
    name: 'Build ${{ github.run_number }}'
```

### Pattern Matching (Unknown Filename)
```yaml
# When your build adds version to filename
- uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app-v*.apk'
    name: 'Android Release'

# When build adds timestamp or hash
- uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'dist/myapp-*.exe'
    name: 'Windows Build ${{ github.run_number }}'
```

**Supported patterns**: `*` (any characters), `?` (single character), `[...]` (character sets)

Useful when your build tool generates dynamic filenames. If multiple files match, each becomes a separate build.

### Multi-Platform
```yaml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        platform: linux
        file: 'dist/app-linux'
      - os: macos-latest
        platform: macos
        file: 'dist/app-macos'
      - os: windows-latest
        platform: windows
        file: 'dist/app.exe'

steps:
  - uses: actions/checkout@v4
  - name: Build
    run: ./build.sh
  - uses: nunu-ai/upload-build-action@v1
    with:
      api-token: ${{ secrets.NUNU_API_TOKEN }}
      project-id: ${{ secrets.NUNU_PROJECT_ID }}
      file: ${{ matrix.file }}
      name: '${{ matrix.platform }} Build ${{ github.run_number }}'
      platform: ${{ matrix.platform }}
```

### With Tags and Auto-Delete
```yaml
- uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app.apk'
    name: 'Dev Build'
    tags: 'version:1.2.3,branch:${{ github.ref_name }}'
    auto-delete: true
```

## How It Works

This action downloads and runs [nunu-cli](https://github.com/nunu-ai/nunu-cli), which automatically collects metadata from the GitHub Actions environment:

- **Git**: Commit hash, branch, author, message
- **Pull Request**: PR number, title, source/target branches (when applicable)
- **CI**: Workflow name, run number, run URL, runner, triggered by
- **Build**: Timestamp, CLI version

The same metadata collection works when using nunu-cli directly in other CI/CD systems.

## Features

- ✅ Simple one-step upload from GitHub Actions
- ✅ Uses nunu-cli under the hood (automatic metadata collection)
- ✅ File pattern matching with glob patterns
- ✅ Automatic platform detection from file extension
- ✅ Large file support (multipart uploads for files >3GB)
- ✅ Smart storage management with auto-delete

## Platform Detection

Automatically detected: `.apk` (android), `.ipa` (ios-native), `.exe/.msi` (windows), `.dmg/.pkg` (macos), `.deb/.rpm/.appimage` (linux)

For ambiguous files (`.zip`, `.tar`, `.app`), specify `platform` explicitly.

## Documentation

Full documentation and advanced usage examples available at [docs.nunu.ai](https://docs.nunu.ai) (requires authentication).

For CLI usage in other CI/CD systems, see [nunu-cli](https://github.com/nunu-ai/nunu-cli).

## Support

Contact us through nunu.ai for support and questions.
