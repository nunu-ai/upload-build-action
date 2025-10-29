import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getCliPath } from './installer';
import type { ActionInputs } from './types';

async function run(): Promise<void> {
  try {
    // Get inputs
    const inputs = getInputs();

    // Validate inputs
    validateInputs(inputs);

    // Get CLI path (downloads and caches if needed)
    const cliPath = await getCliPath(inputs.cliVersion);
    core.info(`Using nunu-cli at: ${cliPath}`);

    // Build command
    const args = buildArgs(inputs);

    // Execute upload
    core.info('Starting upload...');
    core.info(`File: ${inputs.file}`);
    if (inputs.name) {
      core.info(`Name: ${inputs.name}`);
    }

    let output = '';
    let error = '';

    const exitCode = await exec.exec(cliPath, args, {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          error += data.toString();
        },
      },
    });

    if (exitCode !== 0) {
      throw new Error(`Upload failed with exit code ${exitCode}\n${error}`);
    }

    // Parse output for build ID (if CLI outputs it)
    const buildIdMatch = output.match(/Build ID: ([a-f0-9-]+)/i);
    if (buildIdMatch) {
      core.setOutput('build-id', buildIdMatch[1]);
      core.info(`✓ Build ID: ${buildIdMatch[1]}`);
    }

    core.info('✅ Upload completed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

function getInputs(): ActionInputs {
  const autoDelete = core.getInput('auto-delete').toLowerCase() === 'true';

  return {
    apiToken: core.getInput('api-token', { required: true }),
    projectId: core.getInput('project-id', { required: true }),
    file: core.getInput('file', { required: true }),
    name: core.getInput('name') || undefined,
    platform: core.getInput('platform') || undefined,
    description: core.getInput('description') || undefined,
    autoDelete,
    deletionPolicy: core.getInput('deletion-policy') || undefined,
    uploadTimeout: core.getInput('upload-timeout') || undefined,
    cliVersion: core.getInput('cli-version') || 'latest',
  };
}

function validateInputs(inputs: ActionInputs): void {
  // Validate deletion policy
  if (inputs.deletionPolicy && !['least_recent', 'oldest'].includes(inputs.deletionPolicy)) {
    throw new Error(
      `Invalid deletion-policy: ${inputs.deletionPolicy}. Must be "least_recent" or "oldest".`
    );
  }

  // Validate upload timeout if provided
  if (inputs.uploadTimeout) {
    const timeout = parseInt(inputs.uploadTimeout, 10);
    if (isNaN(timeout) || timeout < 1 || timeout > 1440) {
      throw new Error(
        `Invalid upload-timeout: ${inputs.uploadTimeout}. Must be between 1 and 1440.`
      );
    }
  }
}

function buildArgs(inputs: ActionInputs): string[] {
  const args = [
    'upload',
    inputs.file,
    '--token',
    inputs.apiToken,
    '--project-id',
    inputs.projectId,
  ];

  if (inputs.name) {
    args.push('--name', inputs.name);
  }

  if (inputs.platform) {
    args.push('--platform', inputs.platform);
  }

  if (inputs.description) {
    args.push('--description', inputs.description);
  }

  if (inputs.autoDelete) {
    args.push('--auto-delete');
  }

  if (inputs.deletionPolicy) {
    args.push('--deletion-policy', inputs.deletionPolicy);
  }

  if (inputs.uploadTimeout) {
    args.push('--upload-timeout', inputs.uploadTimeout);
  }

  return args;
}

run();