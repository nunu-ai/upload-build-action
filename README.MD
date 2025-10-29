# Upload Build to Nunu.ai

GitHub Action to upload build artifacts to [Nunu.ai](https://nunu.ai) for automated testing.

## Features

- ✅ Simple one-step upload from GitHub Actions
- ✅ Automatic metadata collection (commit, branch, PR info)
- ✅ Support for all platforms (Windows, macOS, Linux, Android, iOS)
- ✅ Large file support via multipart uploads
- ✅ Automatic storage management with configurable deletion policies

## Usage

### Basic Example
```yaml
- name: Upload to Nunu.ai
  uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app.apk'
```

### Complete Example
```yaml
name: Build and Upload

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Android
        run: ./gradlew assembleRelease

      - name: Upload to Nunu.ai
        uses: nunu-ai/upload-build-action@v1
        with:
          api-token: ${{ secrets.NUNU_API_TOKEN }}
          project-id: ${{ secrets.NUNU_PROJECT_ID }}
          file: 'app/build/outputs/apk/release/app-release.apk'
          name: 'Build ${{ github.run_number }}'
          platform: 'android'
          description: 'Automated build from ${{ github.ref }}'
          auto-delete: true
          deletion-policy: 'least_recent'
```

### Multi-Platform Build
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
        file: 'dist/app-windows.exe'

steps:
  - uses: actions/checkout@v4

  - name: Build
    run: ./build.sh

  - name: Upload to Nunu.ai
    uses: nunu-ai/upload-build-action@v1
    with:
      api-token: ${{ secrets.NUNU_API_TOKEN }}
      project-id: ${{ secrets.NUNU_PROJECT_ID }}
      file: ${{ matrix.file }}
      name: '${{ matrix.platform }} Build ${{ github.run_number }}'
      platform: ${{ matrix.platform }}
      auto-delete: true
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-token` | Yes | - | Nunu.ai API token |
| `project-id` | Yes | - | Nunu.ai project ID |
| `file` | Yes | - | Path to build file |
| `name` | No | `Build {run_number}` | Build name |
| `platform` | No | Auto-detected | Target platform |
| `description` | No | - | Build description |
| `auto-delete` | No | `false` | Auto-delete old builds when storage full |
| `deletion-policy` | No | `least_recent` | Deletion policy: `least_recent` or `oldest` |
| `upload-timeout` | No | - | Upload timeout in minutes (1-1440) |
| `cli-version` | No | `latest` | nunu-cli version to use |

## Outputs

| Output | Description |
|--------|-------------|
| `build-id` | The ID of the uploaded build |

### Using Outputs
```yaml
- name: Upload to Nunu.ai
  id: upload
  uses: nunu-ai/upload-build-action@v1
  with:
    api-token: ${{ secrets.NUNU_API_TOKEN }}
    project-id: ${{ secrets.NUNU_PROJECT_ID }}
    file: 'build/app.apk'

- name: Use Build ID
  run: echo "Uploaded build ID: ${{ steps.upload.outputs.build-id }}"
```

## Platforms

Supported platforms:
- `windows` - Windows applications
- `macos` - macOS applications
- `linux` - Linux applications
- `android` - Android APKs
- `ios-native` - iOS native apps
- `ios-simulator` - iOS simulator builds
- `web` - Web applications

Platform is auto-detected from file extension if not specified.

## Setup

### 1. Get API Token

1. Go to [Nunu.ai Settings](https://nunu.ai/settings/tokens)
2. Create a new API token with `project:manage-build-storage` permission
3. Copy the token

### 2. Add Secrets to GitHub

1. Go to your repository **Settings** → **Secrets and variables** → **Actions**
2. Add `NUNU_API_TOKEN` with your API token
3. Add `NUNU_PROJECT_ID` with your project ID

### 3. Use the Action

Add the action to your workflow as shown in the examples above.

## Automatic Metadata Collection

The action automatically collects and includes:

- **Git information**: Commit hash, branch, author
- **Pull request info**: PR number, title, source/target branches
- **CI information**: Workflow name, run number, triggered by
- **Build information**: Timestamp, runner OS

This metadata is visible in the Nunu.ai dashboard and used by the PR bot.

## Storage Management

Enable `auto-delete` to automatically manage storage:
```yaml
- uses: nunu-ai/upload-build-action@v1
  with:
    # ... other inputs ...
    auto-delete: true
    deletion-policy: 'least_recent'  # or 'oldest'
```

**Deletion policies:**
- `least_recent`: Delete builds that haven't been accessed recently (default)
- `oldest`: Delete oldest builds first (FIFO)

## Troubleshooting

### Action fails with "File not found"

Make sure the file path is correct and the file exists after your build step:
```yaml
- name: Verify file exists
  run: ls -lh build/app.apk

- name: Upload
  uses: nunu-ai/upload-build-action@v1
  # ...
```

### Action fails with "Invalid API token"

Verify your token:
1. Check the token has `project:manage-build-storage` permission
2. Ensure the secret name matches exactly: `NUNU_API_TOKEN`
3. Try regenerating the token

### Upload times out

For very large files, increase the timeout:
```yaml
with:
  upload-timeout: '120'  # 2 hours
```

## Support

- 📖 [Documentation](https://docs.nunu.ai)
- 💬 [Discord Community](https://discord.gg/nunu)
- 📧 [Email Support](mailto:support@nunu.ai)

## License

MIT