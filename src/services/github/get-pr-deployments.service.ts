import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

export type DeploymentInfo = {
  id: number;
  environment: string;
  sha: string;
  ref: string;
  createdAt: string;
  updatedAt: string;
  statuses: Array<{
    state: string;
    environmentUrl: string | null;
    createdAt: string;
  }>;
  projectName: string;
};

/**
 * Fetches all deployments for the current PR by querying deployments
 * with environment names matching the PR pattern: PR-{prNumber}/*
 */
export async function getPRDeployments(
  prNumber: number
): Promise<DeploymentInfo[]> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo } = context;
  const { owner, repo: repoName } = repo;

  // GitHub API doesn't support wildcard environment filtering,
  // so we fetch all deployments and filter client-side
  const { data: allDeployments } = await octokit.rest.repos.listDeployments({
    owner,
    repo: repoName,
    per_page: 100, // Fetch up to 100 recent deployments
  });

  // Filter deployments that belong to this PR
  const prEnvironmentPrefix = `PR-${prNumber}/`;
  const prDeployments = allDeployments.filter((deployment) =>
    deployment.environment?.startsWith(prEnvironmentPrefix)
  );

  // Fetch deployment statuses for each deployment
  const deploymentsWithStatuses = await Promise.all(
    prDeployments.map(async (deployment) => {
      const { data: statuses } =
        await octokit.rest.repos.listDeploymentStatuses({
          owner,
          repo: repoName,
          deployment_id: deployment.id,
        });

      // Extract project name from environment: PR-{prNumber}/{projectName}-{workflowRunId}
      const environmentParts = deployment.environment?.split("/") || [];
      const projectPart = environmentParts[1] || "";
      // Remove workflow run ID suffix if present (format: projectName-runId)
      const projectName = projectPart.split("-")[0] || projectPart;

      return {
        id: deployment.id,
        environment: deployment.environment || "",
        sha: deployment.sha,
        ref: deployment.ref,
        createdAt: deployment.created_at,
        updatedAt: deployment.updated_at,
        statuses: statuses.map((status) => ({
          state: status.state,
          environmentUrl: status.environment_url || null,
          createdAt: status.created_at,
        })),
        projectName,
      };
    })
  );

  return deploymentsWithStatuses;
}
