import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

const SHORT_COMMIT_HASH_LENGTH = 7;
const COLLAPSIBLE_THRESHOLD = 3;

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
    "🚀 **Preview Environment Ready!**",
    "",
    buildEnvironmentsTable(previewEnvironments, true),
    "",
    "**Details:**",
    `- **Latest Commit:** \`${latestCommit}\``,
    `- **${actionLabel} at:** ${timestamp}`,
  ].join("\n");
}
