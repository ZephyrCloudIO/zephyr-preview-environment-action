import * as github from "@actions/github";

import { IPreviewEnvironment } from "../../types/preview-environment";

export function getCommentBody(
  previewEnvironments: IPreviewEnvironment[],
  isPrClosed?: boolean,
): string {
  const { payload } = github.context;

  const branch = payload.pull_request?.head?.ref;
  const latestCommit = payload.pull_request?.head?.sha?.substring(0, 7);

  if (isPrClosed) {
    return `**Preview Environment Deactivated!**\n\n
| Project Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ❌ Deactivated | [${previewEnvironment.urls[0]}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ✅ Active | [${previewEnvironment.urls[0]}](${previewEnvironment.urls[0]}) |`).join("\n")}

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Created:** ${new Date().toLocaleString()}`;
}
