import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import {
  PREVIEW_COMMENT_ACTIVE_MARKER,
  PREVIEW_COMMENT_MARKER,
} from "./preview-comment";

const SHORT_COMMIT_HASH_LENGTH = 7;
const COLLAPSIBLE_THRESHOLD = 3;
const ZEPHYR_WEBSITE_URL = "https://zephyr-cloud.io/";
const TABLE_ROW_PATTERN =
  /^\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*\[[^\]]*]\(([^)]+)\)\s*\|$/gm;

function truncateUrl(url: string, maxLength = 70): string {
  const ELLIPSIS = "... ↗";
  const ELLIPSIS_LENGTH = ELLIPSIS.length;

  if (url.length <= maxLength) {
    return url;
  }
  return `${url.slice(0, maxLength - ELLIPSIS_LENGTH)}${ELLIPSIS}`;
}

function buildEnvironmentRow(previewEnvironment: PreviewEnvironment): string {
  const url = previewEnvironment.urls[0];

  return `| ${previewEnvironment.projectName} | 🟢 Ready | [${truncateUrl(url)}](${url}) |`;
}

function buildEnvironmentsTable(
  previewEnvironments: PreviewEnvironment[]
): string {
  const rows = previewEnvironments
    .map((previewEnvironment) => buildEnvironmentRow(previewEnvironment))
    .join("\n");

  const table = `| Application | Status | Preview |
| :-- | :-- | :-- |
${rows}`;

  const shouldCollapse = previewEnvironments.length > COLLAPSIBLE_THRESHOLD;

  if (shouldCollapse) {
    return `<details>
<summary><b>${previewEnvironments.length} deployed applications (click to expand)</b></summary>

${table}
</details>`;
  }

  return table;
}

function getPreviewEnvironmentsFromCommentBody(
  commentBody: null | string | undefined
): PreviewEnvironment[] {
  if (!commentBody) {
    return [];
  }

  const previewEnvironments: PreviewEnvironment[] = [];

  let match = TABLE_ROW_PATTERN.exec(commentBody);

  while (match) {
    const projectName = match[1]?.trim();
    const url = match[2]?.trim();

    if (projectName && url && projectName !== "Name") {
      previewEnvironments.push({ projectName, urls: [url] });
    }

    match = TABLE_ROW_PATTERN.exec(commentBody);
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
  previewEnvironments: PreviewEnvironment[],
  prActionType?: "updated"
): string {
  const { payload, repo } = context;
  const commitSha = payload.pull_request?.head?.sha;
  const latestCommit = commitSha?.slice(0, SHORT_COMMIT_HASH_LENGTH) ?? "N/A";
  const timestamp = `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date())} UTC`;
  const commitUrl = commitSha
    ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo.owner}/${repo.repo}/commit/${commitSha}`
    : undefined;
  const commit = commitUrl
    ? `Commit [\`${latestCommit}\`](${commitUrl})`
    : `Commit \`${latestCommit}\``;

  const actionLabel = prActionType === "updated" ? "Updated" : "Created";

  return [
    PREVIEW_COMMENT_MARKER,
    PREVIEW_COMMENT_ACTIVE_MARKER,
    "### Preview deployment ready",
    "A fresh **Zephyr Cloud** preview is ready to review.",
    "",
    buildEnvironmentsTable(previewEnvironments),
    "",
    `<sub>${commit} · ${actionLabel} ${timestamp} · [Zephyr Cloud](${ZEPHYR_WEBSITE_URL})</sub>`,
  ].join("\n");
}
