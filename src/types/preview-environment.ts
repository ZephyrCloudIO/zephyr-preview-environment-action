export interface PreviewDeploymentTarget {
  name: string;
  url: string;
}

export interface PreviewEnvironment {
  dashboardUrl?: string;
  deployedAt?: number;
  environmentUrls?: PreviewDeploymentTarget[];
  projectName: string;
  tagUrls?: PreviewDeploymentTarget[];
  urls: string[];
}
