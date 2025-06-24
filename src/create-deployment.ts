import * as github from "@actions/github";

export async function createDeployment(
  githubToken: string,
  environmentUrl: string,
): Promise<void | string> {
  try {
    const octokit = github.getOctokit(githubToken);
    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
    const commonParameters = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      description: `Preview environment for PR #${github.context.payload.pull_request?.number}`,
      environment: `Preview-${github.context.payload.pull_request?.number}`,
    };

    const deployment = await octokit.rest.repos.createDeployment({
      ...commonParameters,
      ref: branch || github.context.ref,
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
