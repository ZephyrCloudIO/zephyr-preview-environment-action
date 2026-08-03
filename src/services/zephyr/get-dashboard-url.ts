import type { DeployResult } from "zephyr-agent";

const ZEPHYR_DASHBOARD_URL = "https://app.zephyr-cloud.io";

type DeploymentSnapshot = Pick<DeployResult["snapshot"], "uid" | "version">;

export function getDashboardVersionUrl(snapshot: DeploymentSnapshot): string {
  const {
    app_name: application,
    org: organization,
    repo: project,
  } = snapshot.uid;
  const version = snapshot.version.replaceAll(".", "~");

  return `${ZEPHYR_DASHBOARD_URL}/org/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/app/${encodeURIComponent(application)}/versions/${encodeURIComponent(version)}`;
}
