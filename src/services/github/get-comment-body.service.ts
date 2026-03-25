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

function getStatusCell(env: PreviewEnvironment): string {
  if (env.status === "pending_approval") {
    const approval = env.approval;
    const progress = approval
      ? `${approval.currentApprovals}/${approval.requiredApprovals}`
      : "";
    return `⏳ Pending Approval ${progress}`;
  }
  if (env.status === "rejected") {
    return "❌ Rejected";
  }
  return "✅ Active";
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
${previewEnvironments.map((env) => `| ${env.projectName} | ❌ Deactivated | [${truncateUrl(env.urls[0])}](${env.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  const hasPendingApprovals = previewEnvironments.some(
    (env) => env.status === "pending_approval"
  );
  const hasRejected = previewEnvironments.some(
    (env) => env.status === "rejected"
  );

  let title = "🚀 **Preview Environment Ready!**";
  if (hasPendingApprovals) {
    title = "⏳ **Preview Environment — Awaiting Approval**";
  } else if (hasRejected) {
    title = "❌ **Preview Environment — Deployment Rejected**";
  }

  return `${title}\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironments.map((env) => `| ${env.projectName} | ${getStatusCell(env)} | [${truncateUrl(env.urls[0])}](${env.urls[0]}) |`).join("\n")}

**Details:**
- **Latest Commit:** \`${latestCommit}\`
- **${prActionType === "updated" ? "Updated" : "Created"} at:** ${new Date().toLocaleString()}`;
}
