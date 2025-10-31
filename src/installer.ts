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
  const arch = 'x86_64';

  // Resolve version if 'latest'
  if (version === 'latest') {
    version = await getLatestVersion();
    core.info(`Latest version: ${version}`);
  }

  // Remove 'v' prefix if present for clean version
  const cleanVersion = version.replace(/^v/, '');

  // Check if already cached
  let toolPath = tc.find(TOOL_NAME, cleanVersion);
  if (toolPath) {
    core.info(`✓ Found cached nunu-cli ${cleanVersion}`);
    return path.join(toolPath, getCliFilename(platform));
  }

  // Download CLI
  core.info(`Downloading nunu-cli ${cleanVersion} for ${platform}-${arch}...`);
  const downloadUrl = getDownloadUrl(cleanVersion, platform, arch);
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
    cleanVersion
  );

  core.info(`✓ Cached nunu-cli ${cleanVersion}`);
  return path.join(cachedPath, binaryName);
}

function getDownloadUrl(
  version: string,
  platform: Platform,
  arch: string
): string {
  const platformName = platform === 'darwin' ? 'macos' : platform === 'win32' ? 'windows' : 'linux';
  const extension = platform === 'win32' ? '.exe' : '';

  // Clean filename without version
  const filename = `nunu-cli-${platformName}-${arch}${extension}`;
  const tag = `v${version}`;

  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${filename}`;
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