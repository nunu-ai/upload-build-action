import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as httpm from '@actions/http-client';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import type { GithubRelease, Platform } from './types';

const REPO_OWNER = 'nunu-ai';
const REPO_NAME = 'nunu-cli';
const TOOL_NAME = 'nunu-cli';

export async function getCliPath(version: string): Promise<string> {
  core.info(`Setting up nunu-cli ${version}...`);

  const platform = getPlatform();
  const arch = 'x86_64'; // Expand later for arm64

  // Check if already cached
  let toolPath = tc.find(TOOL_NAME, version);
  if (toolPath) {
    core.info(`✓ Found cached nunu-cli ${version}`);
    const binaryPath = path.join(toolPath, getCliFilename(platform));
    return binaryPath;
  }

  // Resolve version if 'latest'
  if (version === 'latest') {
    version = await getLatestVersion();
    core.info(`Latest version: ${version}`);

    // Check cache again with resolved version
    toolPath = tc.find(TOOL_NAME, version);
    if (toolPath) {
      core.info(`✓ Found cached nunu-cli ${version}`);
      return path.join(toolPath, getCliFilename(platform));
    }
  }

  // Download CLI
  core.info(`Downloading nunu-cli ${version} for ${platform}-${arch}...`);
  const downloadUrl = getDownloadUrl(version, platform, arch);
  core.debug(`Download URL: ${downloadUrl}`);

  const downloadPath = await tc.downloadTool(downloadUrl);
  core.debug(`Downloaded to: ${downloadPath}`);

  // Make executable on Unix
  if (platform !== 'win32') {
    await makeExecutable(downloadPath);
  }

  // Cache it
  const binaryName = getCliFilename(platform);
  const cachedPath = await tc.cacheFile(
    downloadPath,
    binaryName,
    TOOL_NAME,
    version
  );

  core.info(`✓ Cached nunu-cli ${version}`);

  return path.join(cachedPath, binaryName);
}

function getDownloadUrl(
  version: string,
  platform: Platform,
  arch: string
): string {
  // Remove 'v' prefix if present
  const cleanVersion = version.replace(/^v/, '');

  const platformName = platform === 'darwin' ? 'macos' : platform === 'win32' ? 'windows' : 'linux';
  const extension = platform === 'win32' ? '.exe' : '';
  const filename = `nunu-cli-v${cleanVersion}-${platformName}-${arch}${extension}`;

  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${cleanVersion}/${filename}`;
}

async function getLatestVersion(): Promise<string> {
  const http = new httpm.HttpClient('nunu-upload-action');
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

  core.debug(`Fetching latest release from: ${url}`);

  const response = await http.getJson<GithubRelease>(url);

  if (response.statusCode !== 200 || !response.result) {
    throw new Error(
      `Failed to fetch latest release: ${response.statusCode}`
    );
  }

  const version = response.result.tag_name.replace(/^v/, '');
  return version;
}

function getPlatform(): Platform {
  const platform = os.platform();
  if (platform === 'linux' || platform === 'darwin' || platform === 'win32') {
    return platform;
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

function getCliFilename(platform: Platform): string {
  return platform === 'win32' ? 'nunu-cli.exe' : 'nunu-cli';
}

async function makeExecutable(filePath: string): Promise<void> {
  await fs.promises.chmod(filePath, 0o755);
  core.debug(`Made executable: ${filePath}`);
}