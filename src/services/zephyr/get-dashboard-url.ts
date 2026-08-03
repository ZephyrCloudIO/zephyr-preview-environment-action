import type { DeployResult } from "zephyr-agent";

const ZEPHYR_DASHBOARD_URL = "https://app.zephyr-cloud.io";

type DeploymentSnapshot = Pick<
  DeployResult["snapshot"],
  "creator" | "uid" | "version"
>;

function getDashboardVersion(snapshot: DeploymentSnapshot): string {
  const { build } = snapshot.uid;
  const { name: creator } = snapshot.creator;
  const buildSuffix = `.${build}`;
  const versionBase = snapshot.version.endsWith(buildSuffix)
    ? snapshot.version.slice(0, -buildSuffix.length)
    : snapshot.version;
  const includesCreator =
    versionBase.endsWith(`.${creator}`) || versionBase.endsWith(`-${creator}`);
  const version = includesCreator
    ? `${versionBase}.${build}`
    : `${versionBase}.${creator}.${build}`;

  return version.replaceAll(".", "~");
}

export function getDashboardVersionUrl(snapshot: DeploymentSnapshot): string {
  const {
    app_name: application,
    org: organization,
    repo: project,
  } = snapshot.uid;
  const version = getDashboardVersion(snapshot);

  return `${ZEPHYR_DASHBOARD_URL}/org/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/app/${encodeURIComponent(application)}/versions/${encodeURIComponent(version)}`;
}
