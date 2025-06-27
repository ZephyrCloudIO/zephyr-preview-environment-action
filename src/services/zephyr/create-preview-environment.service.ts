import * as core from "@actions/core";
import { getAppDeployResult } from "zephyr-agent";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment(): Promise<string> {
  const applicationUuid = core.getInput("application_uuid");
  const previewUrl = await getAppDeployResult(applicationUuid);

  // Should it throw an error?
  if (!previewUrl) {
    throw new Error("Failed to create preview environment on Zephyr");
  }

  return previewUrl.urls[0];
}
