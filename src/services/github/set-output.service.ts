import { setOutput as setGhOutput } from "@actions/core";
import type { PreviewEnvironment } from "../../types/preview-environment";

export function setOutput(previewEnvironments: PreviewEnvironment[]) {
  const envMap = Object.fromEntries(
    previewEnvironments.map((env) => [env.projectName, env])
  );
  setGhOutput("preview_environments_urls", JSON.stringify(envMap));

  const statusMap = Object.fromEntries(
    previewEnvironments.map((env) => [
      env.projectName,
      env.status ?? "deployed",
    ])
  );
  setGhOutput("deployment_status", JSON.stringify(statusMap));

  const pendingApprovals = previewEnvironments.filter(
    (env) => env.status === "pending_approval"
  );
  if (pendingApprovals.length > 0) {
    setGhOutput("pending_approvals", JSON.stringify(pendingApprovals));
  }
}
