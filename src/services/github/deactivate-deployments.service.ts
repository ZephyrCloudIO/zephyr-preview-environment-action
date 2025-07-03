import * as core from "@actions/core";
import * as github from "@actions/github";

import { IPreviewEnvironment } from "../../types/preview-environment";

export async function deactivateDeployments(
  previewEnvironments: IPreviewEnvironment[],
) {
  const githubToken = core.getInput("github_token");
  const octokit = github.getOctokit(githubToken);

  const { repo, payload } = github.context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  for (const previewEnvironment of previewEnvironments) {
    const environmentName = `Preview/PR-${prNumber}/${previewEnvironment.projectName}`;

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
