export interface ActionInputs {
  apiToken: string;
  projectId: string;
  file: string;
  name?: string;
  platform?: string;
  description?: string;
  autoDelete?: boolean;
  deletionPolicy?: string;
  uploadTimeout?: string;
  tags?: string[];
  cliVersion: string;
}

export interface GithubRelease {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export type Platform = 'linux' | 'darwin' | 'win32';