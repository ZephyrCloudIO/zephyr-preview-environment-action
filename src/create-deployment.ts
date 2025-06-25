import * as github from "@actions/github";

// TODO: Create JobSummary for the deployment
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

    const commonParameters = {
      owner,
      repo,
      description: `Preview environment for PR #${prNumber}`,
      environment: `Preview/PR-${prNumber}`,
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
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating deployment";
  }
}
