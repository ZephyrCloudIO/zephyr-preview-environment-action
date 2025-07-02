import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment(): Promise<string[]> {
  const allDeployedApps = await getAllDeployedApps();
  const allAppDeployResults = await getAllAppDeployResults();

  const previewUrls = allDeployedApps.map((application_uuid) => {
    const previewUrl = allAppDeployResults[application_uuid];

    return previewUrl.urls[0];
  });

  return previewUrls;
}
