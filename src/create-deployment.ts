import * as github from "@actions/github";

// TODO: Create JobSummary for the deployment
// TODO: Figure out a way to deactivate the deployments when the PR is closed without iterating over all deployments
export async function createDeployment(
  githubToken: string,
  environmentUrl: string,
): Promise<void | string> {
  try {
    const octokit = github.getOctokit(githubToken);
    const { owner, repo } = github.context.repo;
    const {
      number: prNumber,
      head: { ref },
    } = github.context.payload.pull_request!;
    const environmentName = `Preview/PR-${prNumber}`;

    const commonParameters = {
      owner,
      repo,
      description: `Preview environment for PR #${prNumber}`,
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
        environment_url: environmentUrl,
        state: "success",
        auto_inactive: true,
      });
    }

    // Deactivate all previous deployments for this PR
    const prIsClosed = github.context.payload.pull_request?.state === "closed";
    if (prIsClosed) {
      const { data: deployments } = await octokit.rest.repos.listDeployments({
        ...commonParameters,
        per_page: 2,
      });

      for (const existingDeployment of deployments) {
        await octokit.rest.repos.createDeploymentStatus({
          ...commonParameters,
          deployment_id: existingDeployment.id,
          environment_url: environmentUrl,
          state: "inactive",
          auto_inactive: true,
        });
      }
    }
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating deployment";
  }
}
