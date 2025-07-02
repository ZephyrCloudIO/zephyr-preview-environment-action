import { getAllAppDeployResults, getAllDeployedApps } from "zephyr-agent";

// TODO: Implement Retry Pattern
// TODO: Handle cache
export async function createPreviewEnvironment(): Promise<string> {
  const allDeployedApps = await getAllDeployedApps();
  const allAppDeployResults = await getAllAppDeployResults();

  // TODO: Handle multiple preview environments
  return allAppDeployResults[allDeployedApps[0]].urls[0];
}
