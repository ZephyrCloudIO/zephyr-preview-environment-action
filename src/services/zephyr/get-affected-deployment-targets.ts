import { warning } from "@actions/core";
import { type DeployResult, getToken } from "zephyr-agent";

import type { PreviewDeploymentTarget } from "../../types/preview-environment";

const ZEPHYR_API_URL = "https://api.zephyr-cloud.io";
const MISSING_TOKEN_WARNING =
  "No Zephyr access token found, so affected tag and environment URLs are not listed. Expose ZE_CI_TOKEN to this action step (for example in the job env), not only to the build step.";
let cachedAccessTokenPromise: Promise<string | undefined> | undefined;

interface DeployedVersion {
  deployTarget?: unknown;
  deployTargetName?: unknown;
  hostUrl?: unknown;
  snapshot_id?: unknown;
}

interface DeployedVersionsResponse {
  entities?: unknown;
}

export interface AffectedDeploymentTargets {
  environmentUrls: PreviewDeploymentTarget[];
  tagUrls: PreviewDeploymentTarget[];
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDeployedVersion(value: unknown): value is DeployedVersion {
  return Boolean(value && typeof value === "object");
}

export function findAffectedDeploymentTargets(
  response: unknown,
  snapshotId: string
): AffectedDeploymentTargets {
  const targets: AffectedDeploymentTargets = {
    environmentUrls: [],
    tagUrls: [],
  };

  if (!response || typeof response !== "object") {
    return targets;
  }

  const { entities } = response as DeployedVersionsResponse;
  if (!Array.isArray(entities)) {
    return targets;
  }

  const seenTargets = new Set<string>();

  for (const entity of entities) {
    if (!isDeployedVersion(entity) || entity.snapshot_id !== snapshotId) {
      continue;
    }

    if (
      (entity.deployTarget !== "environment" &&
        entity.deployTarget !== "tag") ||
      typeof entity.deployTargetName !== "string" ||
      typeof entity.hostUrl !== "string" ||
      !isHttpUrl(entity.hostUrl)
    ) {
      continue;
    }

    const name = entity.deployTargetName.trim();
    const url = entity.hostUrl.trim();
    const targetKey = `${entity.deployTarget}:${name}:${url}`;

    if (!name || seenTargets.has(targetKey)) {
      continue;
    }
    seenTargets.add(targetKey);

    targets[
      entity.deployTarget === "environment" ? "environmentUrls" : "tagUrls"
    ].push({ name, url });
  }

  targets.environmentUrls.sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  targets.tagUrls.sort((left, right) => left.name.localeCompare(right.name));

  return targets;
}

/**
 * Resolves the token the build used. zephyr-agent reads ZE_SECRET_TOKEN, reuses the
 * build's cached ZE_CI_TOKEN exchange (its cache key is private to the agent), or falls
 * back to a stored login. Resolved once per run so every app shares one lookup.
 */
function getZephyrAccessToken(): Promise<string | undefined> {
  cachedAccessTokenPromise ??= (async () => {
    const token = (await getToken())?.trim();
    if (!token) {
      warning(MISSING_TOKEN_WARNING);
    }
    return token || undefined;
  })();

  return cachedAccessTokenPromise;
}

function getDeployedVersionsUrl(snapshot: DeployResult["snapshot"]): URL {
  const {
    app_name: application,
    org: organization,
    repo: project,
  } = snapshot.uid;
  const apiUrl = process.env.ZE_API?.trim() || ZEPHYR_API_URL;
  const path = [organization, project, application]
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(`/v2/application/${path}/versions-deployed?type=all`, apiUrl);
}

export async function getAffectedDeploymentTargets(
  deployResult: DeployResult,
  resolveAccessToken: () => Promise<string | undefined> = getZephyrAccessToken
): Promise<AffectedDeploymentTargets> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { environmentUrls: [], tagUrls: [] };
    }

    const response = await fetch(
      getDeployedVersionsUrl(deployResult.snapshot),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Zephyr API returned ${response.status}`);
    }

    const data: unknown = await response.json();
    return findAffectedDeploymentTargets(
      data,
      deployResult.snapshot.snapshot_id
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warning(`Could not discover affected Zephyr URLs: ${message}`);
    return { environmentUrls: [], tagUrls: [] };
  }
}
