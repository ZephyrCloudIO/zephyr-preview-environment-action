import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";

// TODO: Create JobSummary for the deployment
export async function createDeployments(
  previewEnvironments: PreviewEnvironment[]
): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const {
    number: prNumber,
    head: { ref, sha },
  } = payload.pull_request;

  // Use workflow run ID for uniqueness across parallel jobs
  const workflowRunId = context.runId;

  for (const previewEnvironment of previewEnvironments) {
    const { projectName } = previewEnvironment;
    const environmentName = `PR-${prNumber}/${projectName}-${workflowRunId}`;

    const commonParameters = {
      owner,
      repo: repoName,
      description: `Preview environment for PR #${prNumber} / ${projectName} / ${workflowRunId}`,
      environment: environmentName,
    };

    const deployment = await octokit.rest.repos.createDeployment({
      ...commonParameters,
      ref,
      auto_merge: false,
      required_contexts: [],
      payload: {
        commitSha: sha,
        projectName,
        workflowRunId,
      },
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
