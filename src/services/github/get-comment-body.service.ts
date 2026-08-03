import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import {
  PREVIEW_COMMENT_ACTIVE_MARKER,
  PREVIEW_COMMENT_MARKER,
} from "./preview-comment";

const SHORT_COMMIT_HASH_LENGTH = 7;
const COLLAPSIBLE_THRESHOLD = 3;
const ZEPHYR_DASHBOARD_URL = "https://app.zephyr-cloud.io/";
const ENVIRONMENT_DATA_MARKER_PATTERN =
  /<!-- zephyr-preview-environment-data:([A-Za-z0-9_-]+) -->/g;
const LEGACY_TABLE_ROW_PATTERN =
  /^\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*\[[^\]]*]\(([^)]+)\)\s*\|$/gm;

function formatUtcTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function getCommitDetails(): {
  label: string;
  url?: string;
} {
  const commitSha = context.payload.pull_request?.head?.sha;
  const label = commitSha?.slice(0, SHORT_COMMIT_HASH_LENGTH) ?? "N/A";
  const url = commitSha
    ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${context.repo.owner}/${context.repo.repo}/commit/${commitSha}`
    : undefined;

  return { label, url };
}

function buildEnvironmentRow(previewEnvironment: PreviewEnvironment): string {
  const previewUrl = previewEnvironment.urls[0];
  const status = previewEnvironment.dashboardUrl
    ? `✅ Deployment successful!<br>[View deployment](${previewEnvironment.dashboardUrl})`
    : "✅ Deployment successful!";
  const commit = getCommitDetails();
  const commitLabel = `\`${commit.label}\``;
  const commitLink = commit.url
    ? `[${commitLabel}](${commit.url})`
    : commitLabel;
  const updatedAt = formatUtcTimestamp(
    previewEnvironment.deployedAt ?? Date.now()
  );

  return `| ${status} | ${previewEnvironment.projectName} | ${commitLink} | [Preview URL ↗](${previewUrl}) | ${updatedAt} |`;
}

function buildEnvironmentsTable(
  previewEnvironments: PreviewEnvironment[]
): string {
  const rows = previewEnvironments
    .map((previewEnvironment) => buildEnvironmentRow(previewEnvironment))
    .join("\n");

  const table = `| Status | Name | Latest Commit | Preview URL | Updated (UTC) |
| :-- | :-- | :-- | :-- | :-- |
${rows}`;

  if (previewEnvironments.length > COLLAPSIBLE_THRESHOLD) {
    return `<details>
<summary><b>${previewEnvironments.length} deployed applications (click to expand)</b></summary>

${table}
</details>`;
  }

  return table;
}

function getEnvironmentDataMarkers(
  previewEnvironments: PreviewEnvironment[]
): string[] {
  return previewEnvironments.map((previewEnvironment) => {
    const data = Buffer.from(JSON.stringify(previewEnvironment)).toString(
      "base64url"
    );

    return `<!-- zephyr-preview-environment-data:${data} -->`;
  });
}

function isPreviewEnvironment(value: unknown): value is PreviewEnvironment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PreviewEnvironment>;
  return (
    typeof candidate.projectName === "string" &&
    Array.isArray(candidate.urls) &&
    candidate.urls.every((url) => typeof url === "string")
  );
}

function getPreviewEnvironmentsFromDataMarkers(
  commentBody: string
): PreviewEnvironment[] {
  const previewEnvironments: PreviewEnvironment[] = [];

  for (const match of commentBody.matchAll(ENVIRONMENT_DATA_MARKER_PATTERN)) {
    const encodedEnvironment = match[1];

    if (!encodedEnvironment) {
      continue;
    }

    try {
      const parsedEnvironment: unknown = JSON.parse(
        Buffer.from(encodedEnvironment, "base64url").toString("utf8")
      );

      if (isPreviewEnvironment(parsedEnvironment)) {
        previewEnvironments.push(parsedEnvironment);
      }
    } catch {
      // Ignore malformed metadata and fall back to visible legacy rows.
    }
  }

  return previewEnvironments;
}

function getPreviewEnvironmentsFromCommentBody(
  commentBody: null | string | undefined
): PreviewEnvironment[] {
  if (!commentBody) {
    return [];
  }

  const markedEnvironments = getPreviewEnvironmentsFromDataMarkers(commentBody);

  if (markedEnvironments.length > 0) {
    return markedEnvironments;
  }

  const previewEnvironments: PreviewEnvironment[] = [];

  for (const match of commentBody.matchAll(LEGACY_TABLE_ROW_PATTERN)) {
    const projectName = match[1]?.trim();
    const url = match[2]?.trim();

    if (projectName && url && projectName !== "Name") {
      previewEnvironments.push({ projectName, urls: [url] });
    }
  }

  return previewEnvironments;
}

export function mergePreviewEnvironments(
  existingCommentBody: null | string | undefined,
  previewEnvironments: PreviewEnvironment[]
): PreviewEnvironment[] {
  const mergedEnvironments = new Map<string, PreviewEnvironment>();

  for (const previewEnvironment of getPreviewEnvironmentsFromCommentBody(
    existingCommentBody
  )) {
    mergedEnvironments.set(previewEnvironment.projectName, previewEnvironment);
  }

  for (const previewEnvironment of previewEnvironments) {
    mergedEnvironments.set(previewEnvironment.projectName, previewEnvironment);
  }

  return Array.from(mergedEnvironments.values());
}

export function getCommentBody(
  previewEnvironments: PreviewEnvironment[]
): string {
  return [
    PREVIEW_COMMENT_MARKER,
    PREVIEW_COMMENT_ACTIVE_MARKER,
    ...getEnvironmentDataMarkers(previewEnvironments),
    `### Deploying with ☁️ [Zephyr Cloud](${ZEPHYR_DASHBOARD_URL})`,
    "The latest preview deployments for this pull request.",
    "",
    buildEnvironmentsTable(previewEnvironments),
  ].join("\n");
}
