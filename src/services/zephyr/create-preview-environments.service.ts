import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { getDashboardVersionUrl } from "./get-dashboard-url";

export const NO_DEPLOYED_APPS_MESSAGE =
  "No deployed apps found. Make sure you have built it and deployed it to Zephyr Cloud (check our documentation: https://docs.zephyr-cloud.io/general/get-started)";

export async function createPreviewEnvironments(): Promise<
  PreviewEnvironment[]
> {
  const allDeployedApps = await getAllDeployedApps();
  const allAppDeployResults = await getAllAppDeployResults();

  if (!allDeployedApps.length) {
    throw new Error(NO_DEPLOYED_APPS_MESSAGE);
  }

  const previewEnvironments: PreviewEnvironment[] = allDeployedApps.map(
    (deployedApp) => {
      const deployResult = allAppDeployResults[deployedApp];
      const { snapshot, urls } = deployResult;

      return {
        commitSha: snapshot.git.commit,
        dashboardUrl: getDashboardVersionUrl(snapshot),
        deployedAt: snapshot.createdAt,
        projectName: snapshot.uid.app_name,
        urls,
      };
    }
  );

  return previewEnvironments;
}
