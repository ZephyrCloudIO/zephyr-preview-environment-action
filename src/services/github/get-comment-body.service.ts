import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

function truncateUrl(url: string, maxLength = 70): string {
  const ELLIPSIS = "... ↗";
  const ELLIPSIS_LENGTH = ELLIPSIS.length;

  if (url.length <= maxLength) {
    return url;
  }
  return `${url.substring(0, maxLength - ELLIPSIS_LENGTH)}${ELLIPSIS}`;
}

export function getCommentBody(
  previewEnvironments: PreviewEnvironment[],
  prActionType?: "updated" | "closed"
): string {
  const { payload } = context;

  const SHORT_COMMIT_HASH_LENGTH = 7;
  const latestCommit = payload.pull_request?.head?.sha?.substring(
    0,
    SHORT_COMMIT_HASH_LENGTH
  );

  if (prActionType === "closed") {
    return `**Preview Environment Deactivated!**\n\n
| Project Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ❌ Deactivated | [${truncateUrl(previewEnvironment.urls[0])}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ✅ Active | [${truncateUrl(previewEnvironment.urls[0])}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **${prActionType === "updated" ? "Updated" : "Created"} at:** ${new Date().toLocaleString()}`;
}
