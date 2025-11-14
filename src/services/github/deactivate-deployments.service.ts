import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

// TODO: Figure out a better way to deactivate the deployments properly
export async function deactivateDeployments(
  previewEnvironments: PreviewEnvironment[]
): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  for (const previewEnvironment of previewEnvironments) {
    const environmentName = `PR-${prNumber}/${previewEnvironment.projectName}`;

    const commonParameters = {
      owner,
      repo: repoName,
      description: `Preview environment for PR #${prNumber} / ${previewEnvironment.projectName}`,
      environment: environmentName,
    };

    const { data: deployments } = await octokit.rest.repos.listDeployments({
      ...commonParameters,
    });

    const [latestDeployment] = deployments;

    await octokit.rest.repos.createDeploymentStatus({
      ...commonParameters,
      deployment_id: latestDeployment.id,
      state: "inactive",
    });
  }
}
