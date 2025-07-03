import * as core from "@actions/core";
import * as github from "@actions/github";

import { IPreviewEnvironment } from "../../types/preview-environment";

type CommonParameters = {
  owner: string;
  repo: string;
  description: string;
  environment: string;
};

// TODO: Create JobSummary for the deployment
export async function createDeployments(
  previewEnvironments: IPreviewEnvironment[],
  isPrClosed?: boolean,
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
  const environmentName = `Preview/PR-${prNumber}`;

  const commonParameters = {
    owner,
    repo: repoName,
    description: `Preview environment for PR #${prNumber}`,
    environment: environmentName,
  };

  for (const previewEnvironment of previewEnvironments) {
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

  if (isPrClosed) {
    await deactiveAllPreviousDeployments(octokit, commonParameters);
  }
}

// TODO: Figure out a way to deactivate the deployments when the PR is closed without iterating over all deployments
async function deactiveAllPreviousDeployments(
  octokit: ReturnType<typeof github.getOctokit>,
  { owner, repo, description, environment }: CommonParameters,
): Promise<void> {
  const commonParameters = {
    owner,
    repo,
    description,
    environment,
  };

  // What is a good number for the per_page? Since it could have multiple preview environments per PR
  const { data: deployments } = await octokit.rest.repos.listDeployments({
    ...commonParameters,
    per_page: 10,
  });

  for (const deployment of deployments) {
    await octokit.rest.repos.createDeploymentStatus({
      ...commonParameters,
      deployment_id: deployment.id,
      state: "inactive",
    });
  }
}
