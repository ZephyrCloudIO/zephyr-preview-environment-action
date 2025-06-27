import { getAppDeployResult } from "zephyr-agent";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment(): Promise<string> {
  const appId = "vite-project.zephyr-preview-environment-action.leooliveirax";
  const previewUrl = await getAppDeployResult(appId);

  // Should it throw an error?
  if (!previewUrl) {
    throw new Error("Failed to create preview environment on Zephyr");
  }

  return previewUrl.urls[0];
}
