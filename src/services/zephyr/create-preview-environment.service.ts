import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

import { IPreviewEnvironment } from "../../types/preview-environment";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment(): Promise<
  IPreviewEnvironment[]
> {
  const allDeployedApps = await getAllDeployedApps();
  const allAppDeployResults = await getAllAppDeployResults();

  if (!allDeployedApps.length) {
    throw new Error(
      "No deployed apps found. Make sure you have built it and deployed it to Zephyr",
    );
  }

  const previewEnvironments: IPreviewEnvironment[] = allDeployedApps.map(
    (deployedApp) => {
      const projectName = deployedApp.split(".")[0];
      const urls = allAppDeployResults[deployedApp].urls;

      return {
        projectName,
        urls,
      };
    },
  );

  return previewEnvironments;
}
