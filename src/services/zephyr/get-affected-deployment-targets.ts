import { homedir } from "node:os";
import { resolve } from "node:path";
import { warning } from "@actions/core";
import nodePersist from "node-persist";
import type { DeployResult } from "zephyr-agent";

import type { PreviewDeploymentTarget } from "../../types/preview-environment";

const ZEPHYR_ACCESS_TOKEN_KEY = "ze-auth-token";
const ZEPHYR_API_URL = "https://api.zephyr-cloud.io";
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

function getZephyrAccessToken(): Promise<string | undefined> {
  const tokenFromEnvironment = process.env.ZE_SECRET_TOKEN?.trim();
  if (tokenFromEnvironment) {
    return Promise.resolve(tokenFromEnvironment);
  }

  cachedAccessTokenPromise ??= (async () => {
    await nodePersist.init({
      dir: resolve(homedir(), ".zephyr", "storage"),
      forgiveParseErrors: true,
    });
    const token: unknown = await nodePersist.getItem(ZEPHYR_ACCESS_TOKEN_KEY);

    return typeof token === "string" && token.trim() ? token.trim() : undefined;
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
  deployResult: DeployResult
): Promise<AffectedDeploymentTargets> {
  try {
    const token = await getZephyrAccessToken();
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
