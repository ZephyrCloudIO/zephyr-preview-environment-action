import { setOutput as setGhOutput } from '@actions/core';
import { IPreviewEnvironment } from '../../types/preview-environment';

export function setOutput(previewEnvironments: IPreviewEnvironment[]) {
  const envMap = Object.fromEntries(previewEnvironments.map((env) => [env.projectName, env]));
  setGhOutput('preview_environments_urls', JSON.stringify(envMap));
}
