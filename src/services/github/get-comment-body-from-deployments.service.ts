import type { DeploymentInfo } from "./get-pr-deployments.service";
import type { GroupedDeployments } from "./group-deployments-by-commit.service";

function truncateUrl(url: string, maxLength = 70): string {
  const ELLIPSIS = "... ↗";
  const ELLIPSIS_LENGTH = ELLIPSIS.length;

  if (url.length <= maxLength) {
    return url;
  }
  return `${url.substring(0, maxLength - ELLIPSIS_LENGTH)}${ELLIPSIS}`;
}

function getLatestSuccessfulUrl(deployment: DeploymentInfo): string | null {
  // Find the most recent successful deployment status with a URL
  const successStatus = deployment.statuses.find(
    (status) => status.state === "success" && status.environmentUrl
  );
  return successStatus?.environmentUrl || null;
}

function formatCommitSha(sha: string): string {
  return sha.substring(0, 7);
}

/**
 * Generates comment body for active deployments
 */
function generateActiveComment(groupedDeployments: GroupedDeployments): string {
  const { currentCommitGroup } = groupedDeployments;

  if (!currentCommitGroup || currentCommitGroup.deployments.length === 0) {
    return "🚀 **Preview Environment Ready!**\n\nNo deployments found.";
  }

  // Build table rows for all deployments in the current commit
  const tableRows = currentCommitGroup.deployments
    .map((deployment) => {
      const url = getLatestSuccessfulUrl(deployment);
      const urlDisplay = url ? `[${truncateUrl(url)}](${url})` : "_Pending..._";
      const status = url ? "✅ Active" : "⏳ Pending";

      return `| ${deployment.projectName} | ${status} | ${urlDisplay} |`;
    })
    .join("\n");

  return `🚀 **Preview Environment Ready!**

| Name | Status | URL |
|----|----------|--------|
${tableRows}

**Details:**
- **Latest Commit:** \`${formatCommitSha(currentCommitGroup.commitSha)}\`
- **Updated at:** ${new Date().toLocaleString()}`;
}

/**
 * Generates comment body for closed/deactivated deployments
 */
function generateClosedComment(groupedDeployments: GroupedDeployments): string {
  // Get the most recent commit group for display
  const latestGroup = groupedDeployments.allGroups[0];

  if (!latestGroup || latestGroup.deployments.length === 0) {
    return "**Preview Environment Deactivated!**\n\nNo deployments found.";
  }

  const tableRows = latestGroup.deployments
    .map((deployment) => {
      const url = getLatestSuccessfulUrl(deployment);
      const urlDisplay = url
        ? `[${truncateUrl(url)}](${url})`
        : "_Not available_";

      return `| ${deployment.projectName} | ❌ Deactivated | ${urlDisplay} |`;
    })
    .join("\n");

  return `**Preview Environment Deactivated!**

| Project Name | Status | URL |
|----|----------|--------|
${tableRows}

**Details:**
- **Latest Commit:** \`${formatCommitSha(latestGroup.commitSha)}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
}

/**
 * Generates comment body from deployment information
 *
 * @param groupedDeployments - Deployments grouped by commit SHA
 * @param prActionType - Type of PR action (updated or closed)
 * @returns Formatted markdown comment body
 */
export function getCommentBodyFromDeployments(
  groupedDeployments: GroupedDeployments,
  prActionType?: "updated" | "closed"
): string {
  if (prActionType === "closed") {
    return generateClosedComment(groupedDeployments);
  }

  return generateActiveComment(groupedDeployments);
}
