import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

import type { PreviewEnvironment } from "../../types/preview-environment";

export async function createPreviewEnvironments(): Promise<
  PreviewEnvironment[]
> {
  const allDeployedApps = await getAllDeployedApps();
  const allAppDeployResults = await getAllAppDeployResults();

  if (!allDeployedApps.length) {
    throw new Error(
      "No deployed apps found. Make sure you have built it and deployed it to Zephyr Cloud (check our documentation: https://docs.zephyr-cloud.io/general/get-started)"
    );
  }

  const previewEnvironments: PreviewEnvironment[] = allDeployedApps.map(
    (deployedApp) => {
      const projectName = deployedApp.split(".")[0];
      const urls = allAppDeployResults[deployedApp].urls;

      return {
        projectName,
        urls,
      };
    }
  );

  return previewEnvironments;
}
