import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

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
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ❌ Deactivated | [${previewEnvironment.urls[0]}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ✅ Active | [${previewEnvironment.urls[0]}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **${prActionType === "updated" ? "Updated" : "Created"} at:** ${new Date().toLocaleString()}`;
}
