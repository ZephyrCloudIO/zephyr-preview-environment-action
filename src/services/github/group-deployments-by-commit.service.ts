import type { DeploymentInfo } from "./get-pr-deployments.service";

export type DeploymentsByCommit = {
  commitSha: string;
  deployments: DeploymentInfo[];
  isLatest: boolean;
};

export type GroupedDeployments = {
  currentCommitGroup: DeploymentsByCommit | null;
  allGroups: DeploymentsByCommit[];
  shouldReplaceComment: boolean;
};

/**
 * Groups deployments by commit SHA and determines the update strategy
 *
 * @param deployments - All deployments for the PR
 * @param currentCommitSha - The commit SHA of the current workflow run
 * @returns Grouped deployments with update strategy
 */
export function groupDeploymentsByCommit(
  deployments: DeploymentInfo[],
  currentCommitSha: string
): GroupedDeployments {
  // Group deployments by commit SHA
  const groupedMap = new Map<string, DeploymentInfo[]>();

  for (const deployment of deployments) {
    const existing = groupedMap.get(deployment.sha) || [];
    existing.push(deployment);
    groupedMap.set(deployment.sha, existing);
  }

  // Convert to array and sort by most recent first
  const allGroups: DeploymentsByCommit[] = Array.from(groupedMap.entries())
    .map(([commitSha, commissionDeployments]) => ({
      commitSha,
      deployments: commissionDeployments,
      isLatest: commitSha === currentCommitSha,
    }))
    .sort((a, b) => {
      // Latest commit first
      if (a.isLatest) {
        return -1;
      }
      if (b.isLatest) {
        return 1;
      }

      // Then by most recent deployment creation time
      const aLatest = Math.max(
        ...a.deployments.map((d) => new Date(d.createdAt).getTime())
      );
      const bLatest = Math.max(
        ...b.deployments.map((d) => new Date(d.createdAt).getTime())
      );
      return bLatest - aLatest;
    });

  // Find the current commit group
  const currentCommitGroup = allGroups.find((group) => group.isLatest) || null;

  // Determine if we should replace the entire comment
  // Replace if this is a new commit (current commit is different from previous commits)
  const previousCommits = allGroups.filter((group) => !group.isLatest);
  const shouldReplaceComment = previousCommits.length > 0;

  return {
    currentCommitGroup,
    allGroups,
    shouldReplaceComment,
  };
}
