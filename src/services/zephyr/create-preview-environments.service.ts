import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

import type {
  ApprovalInfo,
  DeploymentStatus,
  PreviewEnvironment,
} from "../../types/preview-environment";

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
      const result = allAppDeployResults[deployedApp];
      const urls = result.urls;

      const env: PreviewEnvironment = {
        projectName,
        urls,
      };

      // Read deployment status from deploy result if available
      const deployResult = result as Record<string, unknown>;
      if (deployResult.status) {
        env.status = deployResult.status as DeploymentStatus;
      }
      if (deployResult.approval && typeof deployResult.approval === "object") {
        const approval = deployResult.approval as Record<string, unknown>;
        env.approval = {
          id: String(approval.id ?? ""),
          status: String(
            approval.status ?? "PENDING"
          ) as ApprovalInfo["status"],
          requiredApprovals: Number(approval.requiredApprovals ?? 0),
          currentApprovals: Number(approval.currentApprovals ?? 0),
        };
      }

      return env;
    }
  );

  return previewEnvironments;
}
