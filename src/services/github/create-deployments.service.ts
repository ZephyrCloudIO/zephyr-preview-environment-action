import * as core from "@actions/core";
import * as github from "@actions/github";

import { IPreviewEnvironment } from "../../types/preview-environment";

// TODO: Create JobSummary for the deployment
export async function createDeployments(
  previewEnvironments: IPreviewEnvironment[],
): Promise<void> {
  const githubToken = core.getInput("github_token");
  const octokit = github.getOctokit(githubToken);

  const { repo, payload } = github.context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const {
    number: prNumber,
    head: { ref },
  } = payload.pull_request;

  for (const previewEnvironment of previewEnvironments) {
    const environmentName = `Preview/PR-${prNumber}/${previewEnvironment.projectName}`;

    const commonParameters = {
      owner,
      repo: repoName,
      description: `Preview environment for PR #${prNumber} / ${previewEnvironment.projectName}`,
      environment: environmentName,
    };

    const deployment = await octokit.rest.repos.createDeployment({
      ...commonParameters,
      ref,
      auto_merge: false,
      required_contexts: [],
    });

    if ("id" in deployment.data) {
      await octokit.rest.repos.createDeploymentStatus({
        ...commonParameters,
        deployment_id: deployment.data.id,
        environment_url: previewEnvironment.urls[0],
        state: "success",
      });
    }
  }
}
