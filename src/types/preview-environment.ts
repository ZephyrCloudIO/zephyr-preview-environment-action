export interface PreviewEnvironment {
  commitSha?: string;
  dashboardUrl?: string;
  deployedAt?: number;
  projectName: string;
  urls: string[];
}
