import { getAppDeployResult } from "zephyr-agent";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment() {
  try {
    const appId = "vite-project.zephyr-preview-environment-action.leooliveirax";
    const previewUrl = await getAppDeployResult(appId);

    return previewUrl?.urls[0];
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating preview environment";
  }
}
