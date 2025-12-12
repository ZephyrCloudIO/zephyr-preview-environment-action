import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { getPRDeployments } from "./get-pr-deployments.service";

/**
 * Deactivates all deployments for the current PR by setting their status to 'inactive'
 */
export async function deactivateDeployments(): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  // Fetch all deployments for this PR
  const prDeployments = await getPRDeployments(prNumber);

  // Deactivate all deployments that are currently active
  for (const deployment of prDeployments) {
    // Check if the deployment has any active status
    const hasActiveStatus = deployment.statuses.some(
      (status) => status.state === "success" || status.state === "pending"
    );

    if (hasActiveStatus) {
      await octokit.rest.repos.createDeploymentStatus({
        owner,
        repo: repoName,
        deployment_id: deployment.id,
        state: "inactive",
        description: `PR #${prNumber} closed`,
      });
    }
  }
}
