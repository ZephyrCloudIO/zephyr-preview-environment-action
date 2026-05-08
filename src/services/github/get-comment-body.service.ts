import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

const SHORT_COMMIT_HASH_LENGTH = 7;
const COLLAPSIBLE_THRESHOLD = 3;
export const PREVIEW_COMMENT_MARKER = "<!-- zephyr-preview-environments -->";
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

function buildEnvironmentRow(
  previewEnvironment: PreviewEnvironment,
  isActive: boolean
): string {
  const url = previewEnvironment.urls[0];
  const status = isActive ? "✅ Active" : "❌ Deactivated";

  return `| ${previewEnvironment.projectName} | ${status} | [${truncateUrl(url)}](${url}) |`;
}

function buildEnvironmentsTable(
  previewEnvironments: PreviewEnvironment[],
  isActive: boolean
): string {
  const rows = previewEnvironments
    .map((previewEnvironment) =>
      buildEnvironmentRow(previewEnvironment, isActive)
    )
    .join("\n");

  const table = `| Name | Status | URL |
|----|----------|--------|
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
  commentBody: string | undefined
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
  existingCommentBody: string | undefined,
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
  prActionType?: "updated" | "closed"
): string {
  const { payload } = context;
  const latestCommit =
    payload.pull_request?.head?.sha?.slice(0, SHORT_COMMIT_HASH_LENGTH) ??
    "N/A";
  const timestamp = new Date().toLocaleString();

  if (prActionType === "closed") {
    return [
      PREVIEW_COMMENT_MARKER,
      "**Preview Environment Deactivated!**",
      "",
      buildEnvironmentsTable(previewEnvironments, false),
      "",
      "**Details:**",
      `- **Latest Commit:** \`${latestCommit}\``,
      `- **Deactivated:** ${timestamp}`,
    ].join("\n");
  }

  const actionLabel = prActionType === "updated" ? "Updated" : "Created";

  return [
    PREVIEW_COMMENT_MARKER,
    "🚀 **Preview Environment Ready!**",
    "",
    buildEnvironmentsTable(previewEnvironments, true),
    "",
    "**Details:**",
    `- **Latest Commit:** \`${latestCommit}\``,
    `- **${actionLabel} at:** ${timestamp}`,
  ].join("\n");
}
