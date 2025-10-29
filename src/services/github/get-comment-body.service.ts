import * as github from "@actions/github";

import { IPreviewEnvironment } from "../../types/preview-environment";

function truncateUrl(url: string, maxLength: number = 70): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '... ↗';
}

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
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ❌ Deactivated | <a href="${previewEnvironment.urls[0]}" target="_blank">${truncateUrl(previewEnvironment.urls[0])}</a> |`).join("\n")}

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((previewEnvironment) => `| ${previewEnvironment.projectName} | ✅ Active | <a href="${previewEnvironment.urls[0]}" target="_blank">${truncateUrl(previewEnvironment.urls[0])}</a> |`).join("\n")}

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Created:** ${new Date().toLocaleString()}`;
}
